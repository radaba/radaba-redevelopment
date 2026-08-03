const absent = (value) =>
  value === undefined || value === null || (typeof value === "string" && !value.trim());

const text = (value) => (absent(value) ? null : String(value).trim());
const email = (value) => text(value)?.toLowerCase() ?? null;
const completed = (value) => {
  if (absent(value)) return null;
  if (value === true || String(value).trim().toLowerCase() === "true") return true;
  if (value === false || value === 0 || ["false", "0"].includes(String(value).trim().toLowerCase()))
    return false;
  return String(value).trim();
};
const timestamp = (value) => text(value);

export const ASSIGNMENT_RIGGER_BASELINE_FIELDS = Object.freeze([
  "assignment_id",
  "rigger_name",
  "rigger_email",
  "assignment_state",
  "assignment_status",
  "completed",
  "completed_datetime",
]);

const normalizeField = (field, value) => {
  if (field === "rigger_email") return email(value);
  if (field === "completed") return completed(value);
  if (field === "completed_datetime") return timestamp(value);
  return text(value);
};

export const isAssignmentFirebasePushKey = (value) =>
  typeof value === "string" && /^-[A-Za-z0-9_-]{19}$/.test(value);

export function assignmentRiggerBaseline(record) {
  return Object.fromEntries(
    ASSIGNMENT_RIGGER_BASELINE_FIELDS.map((field) => [
      field,
      normalizeField(field, record?.[field]),
    ]),
  );
}

export function changedAssignmentRiggerBaselineFields(record, expected) {
  const current = assignmentRiggerBaseline(record);
  const baseline = assignmentRiggerBaseline(expected);
  return ASSIGNMENT_RIGGER_BASELINE_FIELDS.filter((field) => current[field] !== baseline[field]);
}

export function sameAssignmentRiggerBaseline(record, expected) {
  return changedAssignmentRiggerBaselineFields(record, expected).length === 0;
}
