function optionalText(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
}

function numericSource(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") return value;
  return null;
}

export function mapRawAssignmentToListItem(key, raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  return {
    key: String(key),
    assignment_id: optionalText(source.assignment_id),
    tower_id: optionalText(source.tower_id),
    assignment_category: optionalText(source.assignment_category),
    rno_name: optionalText(source.rno_name),
    coordinator_name: optionalText(source.coordinator_name),
    region: optionalText(source.region),
    sub_region: optionalText(source.sub_region),
    company: optionalText(source.company),
    rigger_name: optionalText(source.rigger_name),
    rigger_email: optionalText(source.rigger_email)?.trim().toLowerCase() ?? null,
    assignment_status: optionalText(source.assignment_status),
    assignment_state: optionalText(source.assignment_state),
    created_date: optionalText(source.created_date),
    created_datetime: optionalText(source.created_datetime),
    closed_date: optionalText(source.closed_date),
    closed_datetime: optionalText(source.closed_datetime),
    checkin_datetime: optionalText(source.checkin_datetime),
    completed: source.completed ?? null,
    completed_datetime: optionalText(source.completed_datetime),
    image_total: numericSource(source.image_total),
  };
}
