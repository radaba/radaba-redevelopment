export const ASSIGNMENT_STATES = Object.freeze([
  "Open",
  "Accepted",
  "On Progress",
  "Paused",
  "Finished",
  "Rejected",
  "Dropped",
]);

export const ASSIGNMENT_TRANSITIONS = Object.freeze({
  accept: Object.freeze({
    from: Object.freeze(["Open"]),
    to: "Accepted",
    dateField: "accepted_date",
    datetimeField: "accepted_datetime",
  }),
  start: Object.freeze({
    from: Object.freeze(["Accepted"]),
    to: "On Progress",
    dateField: "checkin_date",
    datetimeField: "checkin_datetime",
  }),
  resume: Object.freeze({ from: Object.freeze(["Paused"]), to: "On Progress" }),
  complete: Object.freeze({
    from: Object.freeze(["On Progress"]),
    to: "Finished",
    dateField: "completed_date",
    datetimeField: "completed_datetime",
  }),
  pause: Object.freeze({
    from: Object.freeze(["On Progress"]),
    to: "Paused",
    dateField: "paused_date",
    datetimeField: "paused_datetime",
  }),
});

export function normalizeAssignmentState(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  return ASSIGNMENT_STATES.find((state) => state.toLowerCase() === normalized) ?? null;
}

export function availableAssignmentTransitions(record) {
  const current = normalizeAssignmentState(record?.assignment_state);
  if (!current) return [];
  return Object.entries(ASSIGNMENT_TRANSITIONS)
    .filter(([, transition]) => transition.from.includes(current))
    .map(([action]) => action);
}

export function buildAssignmentTransition(record, action, timestamp, actor) {
  const transition = ASSIGNMENT_TRANSITIONS[action];
  const current = normalizeAssignmentState(record?.assignment_state);
  if (!transition || !current || !transition.from.includes(current)) return null;
  const createdDate = String(record?.created_date ?? "");
  const fields = {
    assignment_state: transition.to,
    index_created_date_assignment_state: `${transition.to}_${createdDate}`,
    index_created_date_assignment_status: `${transition.to}_${createdDate}`,
  };
  if (transition.dateField && transition.datetimeField) {
    const date = String(timestamp?.date ?? "").trim();
    const datetime = String(timestamp?.datetime ?? "").trim();
    if (!date || !datetime) throw new Error("Transition timestamp is required.");
    fields[transition.dateField] = date;
    fields[transition.datetimeField] = datetime;
  }
  if (action === "complete") {
    const uid = String(actor?.uid ?? "").trim();
    const name = String(actor?.name ?? "").trim();
    if (!uid || !name) throw new Error("Completion actor is required.");
    const riggerEmail = String(record?.rigger_email ?? "");
    fields.assignment_status = "Completed";
    fields.completed = true;
    fields.completed_by_uid = uid;
    fields.completed_by_name = name;
    fields.index_created_date_completed = `true_${createdDate}`;
    fields.rigger_email_assignment_status_assignment_id = `${riggerEmail}_Completed_${String(record?.assignment_id ?? "")}`;
    fields.rigger_email_assignment_status_tower_id = `${riggerEmail}_Completed_${String(record?.tower_id ?? "")}`;
  }
  return fields;
}
