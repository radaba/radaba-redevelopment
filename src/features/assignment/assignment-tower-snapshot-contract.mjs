import { classifyAssignmentForTowerSync } from "../tower/tower-assignment-impact-contract.mjs";

export const ASSIGNMENT_TOWER_SNAPSHOT_FIELDS = Object.freeze([
  "tower_type",
  "tower_height",
  "total_antenna",
  "total_rru",
  "single_sector",
  "multi_sector",
  "route_distance",
  "justifikasi",
]);
export const ASSIGNMENT_SNAPSHOT_PREVIEW_LIMIT = 200;
export const ASSIGNMENT_SNAPSHOT_COMMIT_LIMIT = 50;
export const ASSIGNMENT_SNAPSHOT_CONFIRMATION = "BACKFILL ASSIGNMENTS";
export const assignmentSnapshotFieldLabel = (field) =>
  ({
    tower_type: "Tower Type",
    tower_height: "Tower Height",
    total_antenna: "Total Antenna",
    total_rru: "Total RRU",
    single_sector: "Single Sector",
    multi_sector: "Multi Sector",
    route_distance: "Route Distance",
    justifikasi: "Justifikasi",
  })[field] ?? field;
export const towerSpecificationValuePresent = (value) =>
  value !== null && value !== undefined && !(typeof value === "string" && !value.trim());
export function towerSpecificationStatus(values) {
  const presentCount = values.filter(towerSpecificationValuePresent).length;
  return presentCount === 0
    ? "not_submitted"
    : presentCount === values.length
      ? "available"
      : "partial";
}
export function missingAssignmentSnapshotFields(record) {
  return ASSIGNMENT_TOWER_SNAPSHOT_FIELDS.filter((field) => !Object.hasOwn(record ?? {}, field));
}
export function availableSnapshotBackfill(record, tower) {
  return Object.fromEntries(
    missingAssignmentSnapshotFields(record)
      .filter(
        (field) =>
          Object.hasOwn(tower ?? {}, field) && tower[field] !== undefined && tower[field] !== null,
      )
      .map((field) => [field, tower[field]]),
  );
}
export function classifySnapshotAssignment(record) {
  return classifyAssignmentForTowerSync(record).eligibility;
}
const csv = (value) => {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
};
export function assignmentSnapshotResultCsv(rows) {
  const headings = [
    "assignment_key",
    "assignment_id",
    "tower_key",
    "tower_id",
    "status",
    "classification",
    "missing_fields",
    "repaired_fields",
    "result",
    "message",
  ];
  return `\uFEFF${[headings, ...rows.map((row) => [row.assignmentKey, row.assignmentId, row.towerKey, row.towerId, row.status, row.classification, (row.missingFields ?? []).join("|"), (row.repairedFields ?? []).join("|"), row.result ?? row.classification, row.message ?? row.reason])].map((row) => row.map(csv).join(",")).join("\r\n")}\r\n`;
}
