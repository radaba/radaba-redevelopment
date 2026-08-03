import { TOWER_CREATE_FIELDS } from "./tower-create-contract.mjs";

export const TOWER_TRANSFER_HEADERS = Object.freeze(["firebase_key", ...TOWER_CREATE_FIELDS]);
export const TOWER_PREVIEW_MAX_BYTES = 1024 * 1024;
export const TOWER_PREVIEW_MAX_ROWS = 200;
export const TOWER_MATCH_SCAN_LIMIT = 1000;
export const TOWER_EXPORT_MAX_ROWS = 100;
export const TOWER_NULL_TOKEN = "__NULL__";
const dangerous = new Set(["__proto__", "prototype", "constructor"]);
const numeric = new Set(["latitude", "longitude", "g900", "g1800", "u850", "u900", "u2100", "l700", "l850", "l900", "l1800", "l2100", "l2300", "l2600"]);
const radio = new Set([...numeric].filter(field => !["latitude", "longitude"].includes(field)));

export class TowerTransferError extends Error {
  constructor(code, message, rowNumber = null, field = null) {
    super(message); this.code = code; this.rowNumber = rowNumber; this.field = field;
  }
}

export function escapeSpreadsheetValue(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}
export function escapeCsv(value) {
  const text = escapeSpreadsheetValue(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
export function encodeCsv(headers, rows) {
  return `\uFEFF${[headers, ...rows].map(row => row.map(escapeCsv).join(",")).join("\r\n")}\r\n`;
}

export function parseTransferCsv(input) {
  const text = String(input).replace(/^\uFEFF/, "");
  if (!text.trim()) throw new TowerTransferError("empty_file", "The CSV file is empty.");
  const records = []; let row = [], field = "", quoted = false, closed = false;
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') { field += '"'; index++; }
      else if (character === '"') { quoted = false; closed = true; }
      else field += character;
      continue;
    }
    if (closed && ![",", "\n", "\r"].includes(character))
      throw new TowerTransferError("malformed_csv", "Unexpected characters after a quoted field.");
    if (character === '"') {
      if (field) throw new TowerTransferError("malformed_csv", "Unexpected quote in CSV.");
      quoted = true; closed = false;
    } else if (character === ",") { row.push(field); field = ""; closed = false; }
    else if (character === "\n") { row.push(field.replace(/\r$/, "")); records.push(row); row = []; field = ""; closed = false; }
    else if (character !== "\r" || text[index + 1] !== "\n") field += character;
  }
  if (quoted) throw new TowerTransferError("malformed_csv", "The CSV contains an unterminated quoted field.");
  if (field || row.length) { row.push(field.replace(/\r$/, "")); records.push(row); }
  const nonblank = records.filter(values => values.some(value => value.trim() !== ""));
  if (!nonblank.length) throw new TowerTransferError("empty_file", "The CSV file is empty.");
  const rawHeaders = nonblank[0].map(value => value.trim());
  rawHeaders.forEach((header, index) => {
    if (!header) throw new TowerTransferError("empty_header", `Empty header at column ${index + 1}.`, 1);
    if (dangerous.has(header)) throw new TowerTransferError("dangerous_header", `Unsupported header: ${header}.`, 1, header);
  });
  const duplicates = rawHeaders.filter((header, index) => rawHeaders.indexOf(header) !== index);
  if (duplicates.length) throw new TowerTransferError("duplicate_header", `Duplicate header: ${duplicates[0]}.`, 1, duplicates[0]);
  const unsupported = rawHeaders.filter(header => !TOWER_TRANSFER_HEADERS.includes(header));
  if (unsupported.length) throw new TowerTransferError("unsupported_header", `Unsupported header: ${unsupported[0]}.`, 1, unsupported[0]);
  if (!rawHeaders.includes("tower_id")) throw new TowerTransferError("missing_header", "Missing required header: tower_id.", 1, "tower_id");
  const rows = nonblank.slice(1).map((values, rowIndex) => {
    if (values.length !== rawHeaders.length)
      throw new TowerTransferError("invalid_column_count", `Row ${rowIndex + 2} has the wrong number of columns.`, rowIndex + 2);
    const valuesByField = Object.create(null);
    rawHeaders.forEach((header, index) => { valuesByField[header] = values[index]; });
    return { rowNumber: rowIndex + 2, values: valuesByField };
  });
  if (!rows.length) throw new TowerTransferError("empty_rows", "The CSV contains no data rows.");
  if (rows.length > TOWER_PREVIEW_MAX_ROWS)
    throw new TowerTransferError("too_many_rows", `CSV exceeds the ${TOWER_PREVIEW_MAX_ROWS}-row limit.`);
  return { headers: rawHeaders, rows };
}

function normalizedValue(field, raw) {
  if (raw === "") return { kind: "unchanged" };
  if (raw === TOWER_NULL_TOKEN)
    return { kind: "error", code: "null_not_supported", message: `${TOWER_NULL_TOKEN} is not supported because bulk null removal is not approved.` };
  if (numeric.has(field)) {
    if (raw.trim() === "") return { kind: "unchanged" };
    const value = Number(raw);
    const minimum = radio.has(field) ? 0 : field === "latitude" ? -90 : -180;
    const maximum = radio.has(field) ? 999 : field === "latitude" ? 90 : 180;
    if (!Number.isFinite(value) || value < minimum || value > maximum || (radio.has(field) && !Number.isInteger(value)))
      return { kind: "error", code: `invalid_${field}`, message: `${field} must be ${radio.has(field) ? "a whole number from 0 to 999" : `between ${minimum} and ${maximum}`}.` };
    return { kind: "value", value };
  }
  const value = raw.trim();
  if (!value) return { kind: "unchanged" };
  if (field === "tower_id") {
    const towerId = value.toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9._/-]*$/.test(towerId))
      return { kind: "error", code: "invalid_tower_id", message: "Tower ID contains unsupported characters." };
    return { kind: "value", value: towerId };
  }
  if (value.length > 200) return { kind: "error", code: "value_too_long", message: `${field} exceeds 200 characters.` };
  return { kind: "value", value };
}

const comparable = value => value === undefined ? { state: "missing" } : value === null ? { state: "null" } : { state: "value", value };
export function previewTowerRows(parsed, existingEntries) {
  const existingById = new Map();
  for (const entry of existingEntries) {
    const id = String(entry.record?.tower_id ?? "").trim().toUpperCase();
    if (id) existingById.set(id, [...(existingById.get(id) ?? []), entry]);
  }
  const uploadCounts = new Map();
  parsed.rows.forEach(row => {
    const id = String(row.values.tower_id ?? "").trim().toUpperCase();
    if (id) uploadCounts.set(id, (uploadCounts.get(id) ?? 0) + 1);
  });
  const results = parsed.rows.map(row => {
    const messages = [], proposed = Object.create(null);
    for (const field of parsed.headers) {
      if (field === "firebase_key") continue;
      const normalized = normalizedValue(field, row.values[field]);
      if (normalized.kind === "error") messages.push({ severity: "error", field, code: normalized.code, message: normalized.message });
      if (normalized.kind === "value") proposed[field] = normalized.value;
    }
    const towerId = String(proposed.tower_id ?? row.values.tower_id ?? "").trim().toUpperCase();
    if (!towerId) messages.push({ severity: "error", field: "tower_id", code: "missing_tower_id", message: "Tower ID is required." });
    if (towerId && uploadCounts.get(towerId) > 1)
      messages.push({ severity: "error", field: "tower_id", code: "duplicate_upload", message: "Duplicate Tower ID in uploaded file." });
    const matches = existingById.get(towerId) ?? [];
    const suppliedKey = String(row.values.firebase_key ?? "").trim();
    if (suppliedKey && matches.length === 1 && matches[0].key !== suppliedKey)
      messages.push({ severity: "error", field: "firebase_key", code: "key_mismatch", message: "Firebase key does not match the Tower ID." });
    if (matches.length > 1)
      messages.push({ severity: "error", field: "tower_id", code: "ambiguous_match", message: "Multiple existing Towers share this Tower ID." });
    const matched = matches.length === 1 ? matches[0] : null, differences = [];
    if (!matched && matches.length === 0) for (const field of ["sitename", "region", "new_cluster_name", "latitude", "longitude"]) {
      if (!Object.hasOwn(proposed, field)) messages.push({ severity: "error", field, code: "missing_create_value", message: `${field} is required when creating a new Tower.` });
    }
    if (matched) for (const [field, value] of Object.entries(proposed)) {
      if (field === "tower_id") continue;
      const before = comparable(matched.record[field]), after = comparable(value);
      if (JSON.stringify(before) !== JSON.stringify(after)) differences.push({ field, currentValue: matched.record[field] ?? null, proposedValue: value });
    }
    let classification = "new";
    if (messages.some(message => message.code === "duplicate_upload")) classification = "duplicate";
    else if (messages.some(message => message.code === "ambiguous_match")) classification = "ambiguous";
    else if (messages.length) classification = "invalid";
    else if (matched && differences.length) classification = "changed";
    else if (matched) classification = "unchanged";
    return { rowNumber: row.rowNumber, towerId, classification, messages, differences, original: row.values,
      matched: matched ? { firebaseKey: matched.key, towerId } : null };
  });
  const count = classification => results.filter(row => row.classification === classification).length;
  return {
    totalRows: results.length, validRows: results.filter(row => !row.messages.some(message => message.severity === "error")).length,
    invalidRows: count("invalid"), newTowers: count("new"), changedTowers: count("changed"), unchangedTowers: count("unchanged"),
    ambiguousMatches: count("ambiguous"), duplicateRows: count("duplicate"),
    warningCount: results.reduce((total, row) => total + row.messages.filter(message => message.severity === "warning").length, 0),
    totalChangedFields: results.reduce((total, row) => total + row.differences.length, 0), rows: results,
  };
}

export function towerExportCsv(towers) {
  return encodeCsv(TOWER_TRANSFER_HEADERS, towers.map(tower => TOWER_TRANSFER_HEADERS.map(header => {
    if (header === "firebase_key") return tower.firebaseKey ?? "";
    const value = tower[header] ?? tower.additionalFields?.[header];
    return value === null || value === undefined ? "" : value;
  })));
}
export function towerValidationCsv(rows) {
  const headers = ["row_number", "tower_id", "severity", "field", "code", "message", "current_value", "proposed_value"];
  const values = rows.flatMap(row => row.messages.map(message => {
    const difference = row.differences.find(item => item.field === message.field);
    return [row.rowNumber, row.towerId, message.severity, message.field, message.code, message.message, difference?.currentValue ?? "", difference?.proposedValue ?? ""];
  }));
  return encodeCsv(headers, values);
}
export function towerImportResultCsv(rows) {
  const headers = ["row", "tower_id", "firebase_key", "result", "changed_fields", "error_code", "message"];
  return encodeCsv(headers, rows.map(row => [row.rowNumber, row.towerId, row.firebaseKey ?? "", row.result, (row.changedFields ?? []).join(";"), row.errorCode ?? "", row.message]));
}