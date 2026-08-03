export const ASSIGNMENT_IMPORT_HEADINGS = Object.freeze([
  "tower_id",
  "rno",
  "rigger",
  "coordinator",
  "category",
  "plan_date",
  "description",
]);
export const ASSIGNMENT_IMPORT_SAMPLE_ROWS = Object.freeze([
  Object.freeze([
    "TNG001",
    "rno.andi@example.com",
    "rigger.john@example.com",
    "coordinator.michael@example.com",
    "Installation",
    "2026-07-25",
    "Install new antenna and RRU",
  ]),
  Object.freeze([
    "TNG002",
    "rno.budi@example.com",
    "rigger.ahmad@example.com",
    "coordinator.sarah@example.com",
    "Maintenance",
    "2026-07-26",
    "Replace feeder cable",
  ]),
  Object.freeze([
    "TNG003",
    "rno.citra@example.com",
    "rigger.budi@example.com",
    "coordinator.kevin@example.com",
    "Inspection",
    "2026-07-27",
    "Perform site quality inspection",
  ]),
  Object.freeze([
    "TNG004",
    "rno.dedi@example.com",
    "rigger.andi@example.com",
    "coordinator.michael@example.com",
    "Integration",
    "2026-07-28",
    "Integrate and verify site equipment",
  ]),
  Object.freeze([
    "TNG005",
    "rno.eka@example.com",
    "rigger.dedi@example.com",
    "coordinator.sarah@example.com",
    "Acceptance",
    "2026-07-29",
    "Complete final customer acceptance",
  ]),
]);
export const ASSIGNMENT_IMPORT_MAX_BYTES = 1024 * 1024;
export const ASSIGNMENT_IMPORT_MAX_ROWS = 200;
export const ASSIGNMENT_IMPORT_FILENAME = "radaba-assignment-import-template.csv";
export const ASSIGNMENT_IMPORT_MIME_TYPES = Object.freeze([
  "text/csv",
  "application/vnd.ms-excel",
  "",
]);

export class AssignmentCsvError extends Error {
  constructor(code, message, rowNumber) {
    super(message);
    this.code = code;
    this.rowNumber = rowNumber;
  }
}

export function parseAssignmentCsv(input) {
  const text = String(input).replace(/^\uFEFF/, "");
  if (!text.trim()) throw new AssignmentCsvError("empty-file", "The CSV file is empty.");
  const records = [];
  let row = [],
    field = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
      continue;
    }
    if (c === '"') {
      if (field) throw new AssignmentCsvError("malformed-csv", "Unexpected quote in CSV.");
      quoted = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field.replace(/\r$/, ""));
      records.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (quoted)
    throw new AssignmentCsvError("malformed-csv", "The CSV contains an unterminated quoted field.");
  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    records.push(row);
  }
  const nonblank = records.filter((r) => r.some((v) => v.trim() !== ""));
  if (!nonblank.length) throw new AssignmentCsvError("empty-file", "The CSV file is empty.");
  const header = nonblank[0].map((v) => v.trim().toLowerCase());
  if (new Set(header).size !== header.length)
    throw new AssignmentCsvError("duplicate-header", "The CSV contains a duplicate heading.", 1);
  if (
    header.length !== ASSIGNMENT_IMPORT_HEADINGS.length ||
    header.some((v, i) => v !== ASSIGNMENT_IMPORT_HEADINGS[i])
  ) {
    const unknown = header.filter((v) => !ASSIGNMENT_IMPORT_HEADINGS.includes(v));
    throw new AssignmentCsvError(
      unknown.length ? "unknown-header" : "invalid-header",
      "CSV headings and order do not match the template.",
      1,
    );
  }
  const rows = nonblank.slice(1).map((values, index) => {
    if (values.length !== header.length)
      throw new AssignmentCsvError(
        "extra-columns",
        "A row has the wrong number of columns.",
        index + 2,
      );
    return {
      rowNumber: index + 2,
      ...Object.fromEntries(header.map((h, i) => [h, values[i].trim()])),
    };
  });
  if (!rows.length) throw new AssignmentCsvError("empty-file", "The CSV contains no data rows.");
  if (rows.length > ASSIGNMENT_IMPORT_MAX_ROWS)
    throw new AssignmentCsvError(
      "row-limit",
      `CSV exceeds the ${ASSIGNMENT_IMPORT_MAX_ROWS}-row limit.`,
    );
  return rows;
}

function safe(value) {
  const text = String(value ?? "");
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}
export function escapeImportCsv(value) {
  const text = safe(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
export function assignmentImportTemplate() {
  return `\uFEFF${[ASSIGNMENT_IMPORT_HEADINGS, ...ASSIGNMENT_IMPORT_SAMPLE_ROWS].map((row) => row.map(escapeImportCsv).join(",")).join("\r\n")}\r\n`;
}
export function assignmentImportErrorReport(rows) {
  const headings = ["row_number", "tower_id", "status", "error_code", "field", "message"];
  return `\uFEFF${[headings, ...rows.flatMap((r) => (r.errors?.length ? r.errors : [{ code: r.code, field: r.field, message: r.message }]).map((error) => [r.rowNumber, r.towerId ?? "", r.status, error.code ?? "", error.field ?? "", error.message ?? ""]))].map((r) => r.map(escapeImportCsv).join(",")).join("\r\n")}\r\n`;
}
