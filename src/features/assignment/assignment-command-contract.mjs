export const ASSIGNMENT_INITIAL_STATUS = "Open";
export const ASSIGNMENT_INITIAL_STATE = "Open";
export const ASSIGNMENT_INITIAL_FTP_CHECK = "Not Available";
export const ASSIGNMENT_REVISIT_STATUS = "Open";
export const ASSIGNMENT_REVISIT_STATE = "On Progress";
export const ASSIGNMENT_TERMINAL_STATES = Object.freeze(["Finished", "Rejected", "Dropped"]);

export function jakartaParts(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map(({ type, value }) => [type, value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    datetime: `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`,
    idDate: `${parts.month}${parts.day}${String(parts.year).slice(-2)}`,
  };
}

export function buildAssignmentId(towerId, now = new Date()) {
  const trustedTowerId = String(towerId).trim().toUpperCase();
  if (!trustedTowerId) throw new Error("Tower ID is required.");
  return `NPMXL_${trustedTowerId}_${jakartaParts(now).idDate}_${Math.floor(now.getTime() / 1000)}`;
}

const SOURCES = Object.freeze({
  index_created_date_assignment_category: "assignment_category",
  index_created_date_assignment_state: "assignment_state",
  index_created_date_assignment_status: "assignment_status",
  index_created_date_company: "company",
  index_created_date_completed: "completed",
  index_created_date_coordinator_name: "coordinator_name",
  index_created_date_kabupaten: "kabupaten",
  index_created_date_kecamatan: "kecamatan",
  index_created_date_province: "province",
  index_created_date_region: "region",
  index_created_date_rigger_email: "rigger_email",
  index_created_date_rigger_name: "rigger_name",
  index_created_date_rno_name: "rno_name",
  index_created_date_sub_region: "sub_region",
  index_created_date_tower_id: "tower_id",
});

export const ASSIGNMENT_CREATED_COMPOSITE_FIELDS = Object.freeze(Object.keys(SOURCES));

export function buildCreatedAssignmentComposites(record) {
  if (!record.created_date) throw new Error("created_date is required.");
  return Object.fromEntries(
    Object.entries(SOURCES).map(([field, source]) => [
      field,
      `${String(record[source] ?? "")}_${record.created_date}`,
    ]),
  );
}

export function buildRiggerDependentFields(record, rigger) {
  const fields = {
    rigger_name: rigger.name,
    rigger_email: rigger.email,
    index_created_date_rigger_name: `${rigger.name}_${record.created_date}`,
    index_created_date_rigger_email: `${rigger.email}_${record.created_date}`,
    rigger_email_assignment_status_assignment_id: `${rigger.email}_${record.assignment_status}_${record.assignment_id}`,
    rigger_email_assignment_status_tower_id: `${rigger.email}_${record.assignment_status}_${record.tower_id}`,
  };
  if (record.closed_date && Object.hasOwn(record, "index_closed_date_rigger_name")) {
    fields.index_closed_date_rigger_name = `${rigger.name}_${record.closed_date}`;
  }
  return fields;
}

const normalizedRiggerValue = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

export function isRiggerAssignmentChange(record, requestedRigger) {
  const currentEmail = normalizedRiggerValue(record?.rigger_email);
  const requestedEmail = normalizedRiggerValue(requestedRigger?.email);
  if (currentEmail) return currentEmail !== requestedEmail;

  const currentName = normalizedRiggerValue(record?.rigger_name);
  const requestedName = normalizedRiggerValue(requestedRigger?.name);
  if (currentName) return currentName !== requestedName;

  return Boolean(requestedEmail || requestedName);
}
export function isCompletedAssignment(record) {
  const status = String(record?.assignment_status ?? "")
    .trim()
    .toLowerCase();
  const state = String(record?.assignment_state ?? "")
    .trim()
    .toLowerCase();
  const completed =
    record?.completed === true ||
    String(record?.completed ?? "")
      .trim()
      .toLowerCase() === "true";
  const completedAt = String(record?.completed_datetime ?? "").trim();
  const explicitlyActive =
    ["open", "accepted", "on progress", "paused"].includes(state) &&
    status !== "completed" &&
    !completed;
  if (explicitlyActive) return false;
  return (
    status === "completed" ||
    state === "completed" ||
    state === "finished" ||
    completed ||
    Boolean(completedAt)
  );
}

export function buildRevisitedAssignment(record, eventKey, event) {
  const count = Math.max(0, Number.parseInt(String(record.revisit_count ?? "0"), 10) || 0) + 1;
  const createdDate = String(record.created_date ?? "");
  const closedDate = String(record.closed_date ?? "");
  const riggerEmail = String(record.rigger_email ?? "");
  const assignmentId = String(record.assignment_id ?? "");
  const towerId = String(record.tower_id ?? "");
  const history =
    record.revisit_history && typeof record.revisit_history === "object"
      ? record.revisit_history
      : {};
  const next = {
    ...record,
    assignment_state: ASSIGNMENT_REVISIT_STATE,
    assignment_status: ASSIGNMENT_REVISIT_STATUS,
    completed: false,
    revisit_count: count,
    last_revisit_at: event.at,
    last_revisit_by: event.by_name,
    last_revisit_reason: event.reason,
    revisit_history: { ...history, [eventKey]: event },
    index_created_date_assignment_state: `${ASSIGNMENT_REVISIT_STATE}_${createdDate}`,
    index_created_date_assignment_status: `${ASSIGNMENT_REVISIT_STATUS}_${createdDate}`,
    index_created_date_completed: `false_${createdDate}`,
    rigger_email_assignment_status_assignment_id: `${riggerEmail}_${ASSIGNMENT_REVISIT_STATUS}_${assignmentId}`,
    rigger_email_assignment_status_tower_id: `${riggerEmail}_${ASSIGNMENT_REVISIT_STATUS}_${towerId}`,
  };
  if (closedDate && Object.hasOwn(record, "index_closed_date_assignment_status"))
    next.index_closed_date_assignment_status = `${ASSIGNMENT_REVISIT_STATE}_${closedDate}`;
  if (closedDate && Object.hasOwn(record, "index_closed_date_completed"))
    next.index_closed_date_completed = `false_${closedDate}`;
  return { record: next, revisitCount: count };
}
export function isTerminalAssignment(record) {
  return ASSIGNMENT_TERMINAL_STATES.includes(String(record.assignment_state ?? ""));
}
