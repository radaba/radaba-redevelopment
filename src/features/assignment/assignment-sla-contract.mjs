const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const ASSIGNMENT_SLA_CONFIG = Object.freeze({
  targetMsByStatus: Object.freeze({
    Open: 24 * HOUR,
    Accepted: 12 * HOUR,
    "On Progress": 72 * HOUR,
    Paused: 24 * HOUR,
  }),
  warningRatio: 0.75,
  escalationOverdueMs: 24 * HOUR,
  escalationPausedMs: 24 * HOUR,
  escalationRevisitCount: 2,
});

const WALL_TIME = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/;
const ACTIVE = new Set(["Open", "Accepted", "On Progress", "Paused"]);
const TERMINAL = new Set(["Finished", "Rejected", "Dropped"]);
const text = (value) => String(value ?? "").trim();

export function assignmentSlaTimestamp(value) {
  const match = text(value).match(WALL_TIME);
  if (!match) return null;
  const timestamp = Date.UTC(
    Number(match[1]), Number(match[2]) - 1, Number(match[3]),
    Number(match[4] ?? 0), Number(match[5] ?? 0), Number(match[6] ?? 0),
  );
  return Number.isFinite(timestamp) ? timestamp : null;
}

const firstTimestamp = (record, ...fields) => {
  for (const field of fields) {
    const value = assignmentSlaTimestamp(record[field]);
    if (value !== null) return value;
  }
  return null;
};
const safeDuration = (start, end) =>
  start !== null && end !== null && end >= start ? end - start : null;
const latest = (values) => {
  const available = values.filter((value) => value !== null);
  return available.length ? Math.max(...available) : null;
};

export function assignmentAgingBucket(ageMs) {
  if (ageMs === null || ageMs < 0) return null;
  if (ageMs < 2 * DAY) return "0-1";
  if (ageMs < 4 * DAY) return "2-3";
  if (ageMs < 8 * DAY) return "4-7";
  if (ageMs < 15 * DAY) return "8-14";
  return "15+";
}

function statusStart(record, status, checkin, paused, revisit) {
  if (status === "Open") return firstTimestamp(record, "created_datetime", "created_date");
  if (status === "Accepted") return firstTimestamp(record, "accepted_datetime", "accepted_date");
  if (status === "Paused") return paused;
  if (status !== "On Progress") return null;
  if (paused !== null && (revisit === null || revisit <= paused)) return null;
  return revisit !== null && (checkin === null || revisit > checkin) ? revisit : checkin;
}

export function evaluateAssignmentSla(record, now = new Date()) {
  const nowMs = now instanceof Date ? now.getTime() : Number(now);
  const status = text(record.assignment_state || record.assignment_status);
  const created = firstTimestamp(record, "created_datetime", "created_date");
  const accepted = firstTimestamp(record, "accepted_datetime", "accepted_date");
  const checkin = firstTimestamp(record, "checkin_datetime", "checkin_date");
  const paused = firstTimestamp(record, "paused_datetime", "paused_date");
  const revisit = assignmentSlaTimestamp(record.last_revisit_at);
  const terminalAt = firstTimestamp(
    record, "completed_datetime", "closed_datetime", "rejected_datetime",
    "completed_date", "closed_date", "rejected_date",
  );
  const end = TERMINAL.has(status) ? terminalAt : nowMs;
  const assignmentAgeMs = safeDuration(created, end);
  const stateStartedAtMs = statusStart(record, status, checkin, paused, revisit);
  const statusAgeMs = ACTIVE.has(status) ? safeDuration(stateStartedAtMs, nowMs) : null;
  const targetMs = ASSIGNMENT_SLA_CONFIG.targetMsByStatus[status] ?? null;
  const limitations = [];

  let workingDurationMs = null;
  if (checkin !== null) {
    if (paused === null) workingDurationMs = safeDuration(checkin, end);
    else if (status === "Paused") workingDurationMs = safeDuration(checkin, paused);
    else if (revisit !== null && revisit > paused)
      limitations.push("Working duration is unavailable after resume because full resume history is not stored.");
    else if (status === "On Progress")
      limitations.push("Current status age and working duration are unavailable because a resume timestamp is not stored.");
  }
  const pauseDurationMs = status === "Paused" ? safeDuration(paused, nowMs) : null;

  const activityValues = [
    created, accepted, checkin, paused, terminalAt, revisit,
    assignmentSlaTimestamp(record.work_checklist?.updated_at),
    assignmentSlaTimestamp(record.work_report?.updated_at),
  ];
  const lastActivityAtMs = latest(activityValues);
  const timeSinceLastActivityMs = safeDuration(lastActivityAtMs, nowMs);
  const revisitCount = Math.max(0, Number(record.revisit_count ?? 0) || 0);
  const escalationReasons = [];
  const overdueMs = targetMs !== null && statusAgeMs !== null
    ? Math.max(0, statusAgeMs - targetMs) : 0;
  if (overdueMs >= ASSIGNMENT_SLA_CONFIG.escalationOverdueMs)
    escalationReasons.push("Overdue by at least 24 hours");
  if (status === "Paused" && pauseDurationMs !== null &&
      pauseDurationMs >= ASSIGNMENT_SLA_CONFIG.escalationPausedMs)
    escalationReasons.push("Paused for at least 24 hours");
  if (revisitCount >= ASSIGNMENT_SLA_CONFIG.escalationRevisitCount)
    escalationReasons.push("Multiple revisits");

  let state = "Unavailable";
  if (TERMINAL.has(status) || !ACTIVE.has(status)) state = "Not Applicable";
  else if (escalationReasons.length) state = "Escalated";
  else if (targetMs !== null && statusAgeMs !== null && statusAgeMs > targetMs) state = "Overdue";
  else if (targetMs !== null && statusAgeMs !== null &&
           statusAgeMs >= targetMs * ASSIGNMENT_SLA_CONFIG.warningRatio) state = "Warning";
  else if (targetMs !== null && statusAgeMs !== null) state = "On Track";
  else limitations.push("SLA state cannot be calculated from the available status timestamps.");

  return {
    state, status, targetMs, stateStartedAtMs, statusAgeMs, assignmentAgeMs,
    workingDurationMs, pauseDurationMs, lastActivityAtMs, timeSinceLastActivityMs,
    remainingMs: targetMs !== null && statusAgeMs !== null ? Math.max(0, targetMs - statusAgeMs) : null,
    overdueMs, escalationReasons, agingBucket: assignmentAgingBucket(assignmentAgeMs), limitations,
  };
}

export function matchesAssignmentSlaFilters(record, filters, now = new Date()) {
  if (!filters?.slaState && !filters?.agingBucket) return true;
  const result = evaluateAssignmentSla(record, now);
  return (!filters.slaState || result.state === filters.slaState) &&
    (!filters.agingBucket || result.agingBucket === filters.agingBucket);
}
