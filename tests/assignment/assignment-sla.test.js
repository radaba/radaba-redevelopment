import assert from "node:assert/strict";
import test from "node:test";
import {
  ASSIGNMENT_SLA_CONFIG,
  assignmentAgingBucket,
  assignmentSlaTimestamp,
  evaluateAssignmentSla,
  matchesAssignmentSlaFilters,
} from "../../src/features/assignment/assignment-sla-contract.mjs";

const now = new Date("2026-07-25T12:00:00Z");
const open = (created) => ({ assignment_state: "Open", created_datetime: created });

test("central SLA contract defines each active status once", () => {
  assert.deepEqual(ASSIGNMENT_SLA_CONFIG.targetMsByStatus, {
    Open: 86400000, Accepted: 43200000, "On Progress": 259200000, Paused: 86400000,
  });
});

test("parses legacy Jakarta wall time consistently without host timezone dependence", () => {
  assert.equal(assignmentSlaTimestamp("2026-07-25 09:30:00"), Date.UTC(2026, 6, 25, 9, 30));
});

test("calculates warning, overdue, and escalation thresholds", () => {
  assert.equal(evaluateAssignmentSla(open("2026-07-24 16:00:00"), now).state, "Warning");
  assert.equal(evaluateAssignmentSla(open("2026-07-24 11:00:00"), now).state, "Overdue");
  const escalated = evaluateAssignmentSla(open("2026-07-23 11:00:00"), now);
  assert.equal(escalated.state, "Escalated");
  assert.equal(escalated.overdueMs, 90000000);
});

test("paused age and repeated revisits make escalation ready without notifications", () => {
  const paused = evaluateAssignmentSla({
    assignment_state: "Paused", created_datetime: "2026-07-20 12:00:00",
    checkin_datetime: "2026-07-21 12:00:00", paused_datetime: "2026-07-24 11:00:00",
  }, now);
  assert.equal(paused.state, "Escalated");
  assert.equal(paused.pauseDurationMs, 90000000);
  assert.equal(paused.workingDurationMs, 255600000);
  assert.ok(paused.escalationReasons.includes("Paused for at least 24 hours"));

  assert.equal(evaluateAssignmentSla({ ...open("2026-07-25 11:00:00"), revisit_count: 2 }, now).state, "Escalated");
});

test("does not fabricate resumed status age or historical pause duration", () => {
  const result = evaluateAssignmentSla({
    assignment_state: "On Progress", created_datetime: "2026-07-20 12:00:00",
    checkin_datetime: "2026-07-21 12:00:00", paused_datetime: "2026-07-22 12:00:00",
  }, now);
  assert.equal(result.state, "Unavailable");
  assert.equal(result.statusAgeMs, null);
  assert.equal(result.pauseDurationMs, null);
  assert.equal(result.workingDurationMs, null);
  assert.ok(result.limitations.length > 0);
});

test("terminal assignments are not presented as on track", () => {
  const result = evaluateAssignmentSla({
    assignment_state: "Finished", created_datetime: "2026-07-20 12:00:00",
    completed_datetime: "2026-07-22 12:00:00",
  }, now);
  assert.equal(result.state, "Not Applicable");
  assert.equal(result.assignmentAgeMs, 172800000);
});

test("assigns aging buckets and applies combined read-only filters", () => {
  assert.equal(assignmentAgingBucket(86400000), "0-1");
  assert.equal(assignmentAgingBucket(3 * 86400000), "2-3");
  assert.equal(assignmentAgingBucket(7 * 86400000), "4-7");
  assert.equal(assignmentAgingBucket(14 * 86400000), "8-14");
  assert.equal(assignmentAgingBucket(15 * 86400000), "15+");
  assert.equal(matchesAssignmentSlaFilters(open("2026-07-23 11:00:00"), {
    slaState: "Escalated", agingBucket: "2-3",
  }, now), true);
});
