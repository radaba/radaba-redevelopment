import { createHash } from "node:crypto";

const CATEGORY_PREFIXES = Object.freeze([
  ["foto_rru_serial_number", "RRU Serial Number"],
  ["foto_antenna_serial_number", "Antenna Serial Number"],
  ["foto_wah_certificate_rigger", "WAH Certificate Rigger"],
  ["foto_rigger_body_harness", "Rigger Body Harness"],
  ["foto_mechanical_tilt", "Mechanical Tilt"],
  ["foto_electrical_tilt", "Electrical Tilt"],
  ["foto_site_overview", "Site Overview"],
  ["foto_tower_height", "Tower Height"],
  ["foto_rru_type", "RRU Type"],
  ["foto_antenna", "Antenna"],
  ["foto_azimuth", "Azimuth"],
  ["foto_tower", "Tower"],
  ["foto_sector", "Sector"],
  ["foto_gps", "GPS"],
  ["foto_before", "Before"],
  ["foto_after", "After"],
]);

const IMAGE_FIELD = /^(?:foto_|_)[a-z0-9_]*_(?:name|url)$/i;
const SECTOR_BAND_SUFFIX = /_sector_(\d+)_([a-z]\d+)$/i;

const value = (input) => {
  if (input === null || input === undefined) return null;
  const result = String(input).trim();
  return result || null;
};

export function parseImageField(baseField) {
  const normalized = String(baseField).toLowerCase();
  const category = CATEGORY_PREFIXES.find(([prefix]) =>
    normalized === prefix || normalized.startsWith(`${prefix}_sector_`) ||
    normalized.startsWith(`${prefix}_before`) || normalized.startsWith(`${prefix}_after`),
  );
  const suffix = normalized.match(SECTOR_BAND_SUFFIX);
  const fallback = normalized
    .replace(/^foto_/, "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
  return {
    category: category?.[1] ?? `Unclassified: ${fallback}`,
    categoryKnown: Boolean(category),
    sector: suffix?.[1] ?? null,
    band: suffix?.[2] ?? null,
  };
}

export function createImageId(sourceRecordType, sourceRecordKey, fieldKey) {
  const payload = `${sourceRecordType}\0${sourceRecordKey}\0${fieldKey}`;
  return createHash("sha256").update(payload).digest("base64url").slice(0, 32);
}

export function extractEmbeddedImages({ sourceRecordType, sourceRecordKey, record }) {
  const bases = new Set();
  for (const key of Object.keys(record)) {
    if (IMAGE_FIELD.test(key)) bases.add(key.replace(/_(?:name|url)$/i, ""));
  }
  return [...bases].sort().map((fieldKey) => {
    const nameField = `${fieldKey}_name`;
    const urlField = `${fieldKey}_url`;
    const parsed = parseImageField(fieldKey);
    const fileName = value(record[nameField]);
    const url = value(record[urlField]);
    const explicitSector = sourceRecordType === "cell" ? value(record.sector) : null;
    const explicitBand = sourceRecordType === "cell" ? value(record.band) : null;
    return {
      id: createImageId(sourceRecordType, sourceRecordKey, fieldKey),
      sourceRecordType,
      sourceRecordKey,
      fieldKey,
      nameField,
      urlField,
      fileName,
      url,
      category: parsed.category,
      categoryKnown: parsed.categoryKnown,
      assignmentId: value(record.assignment_id),
      towerId: value(record.tower_id),
      siteName: value(record.sitename),
      cellKey: sourceRecordType === "cell" ? sourceRecordKey : null,
      rcellId: value(record.rcell_id),
      sector: explicitSector ?? parsed.sector,
      band: explicitBand ?? parsed.band,
      riggerName: value(record.rigger_name),
      riggerEmail: value(record.rigger_email),
      submittedAt: value(record.closed_datetime ?? record.closed_date),
      dataQuality: fileName && url ? "complete" : url ? "missing-name" : "missing-url",
    };
  });
}

export function safeStorageContext(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const object = decodeURIComponent(parsed.pathname.split("/o/")[1] ?? parsed.pathname);
    return `${parsed.hostname}/${object}`;
  } catch {
    return "Invalid or legacy storage reference";
  }
}
