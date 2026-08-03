export const ASSIGNMENT_CSV_HEADINGS = Object.freeze([
  'Assignment ID',
  'Region',
  'Sub-region',
  'Partner',
  'Rigger',
  'Status',
  'Assignment Time',
  'Finished Time',
  'Image Total',
]);

export const ASSIGNMENT_EXPORT_MAX_ROWS = 5000;
export const ASSIGNMENT_CSV_USES_BOM = true;

function spreadsheetSafe(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

export function escapeCsvCell(value) {
  const safe = spreadsheetSafe(value);
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

export function assignmentCsvFilename(date) {
  return `radaba-assignments-${date}.csv`;
}

export function serializeAssignmentCsv(rows) {
  const lines = [
    ASSIGNMENT_CSV_HEADINGS.map(escapeCsvCell).join(','),
    ...rows.map((row) => [
      row.assignment_id,
      row.region,
      row.sub_region,
      row.company,
      row.rigger_name,
      row.assignment_state,
      row.created_date,
      row.closed_date,
      row.image_total,
    ].map(escapeCsvCell).join(',')),
  ];
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}
