import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  buildRevisitedAssignment,
  isCompletedAssignment,
} from "../../src/features/assignment/assignment-command-contract.mjs";

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8");
const event = (overrides = {}) => ({
  action: "Assignment Revisited",
  at: "2026-07-25 10:30:00",
  by_uid: "uid-1",
  by_name: "John Doe",
  reason: "Incorrect antenna alignment.",
  previous_status: "Finished",
  new_status: "On Progress",
  previous_completed_at: "2026-07-24 18:00:00",
  ...overrides,
});

test("revisit preserves identity and completion history while reopening existing assignment", () => {
  const original = {
    assignment_id: "A-1",
    tower_id: "TNG001",
    assignment_state: "Finished",
    assignment_status: "Completed",
    completed: true,
    created_date: "2026-07-01",
    completed_datetime: "2026-07-24 18:00:00",
    closed_date: "2026-07-24",
    closed_datetime: "2026-07-24 18:00:00",
    rigger_email: "rigger@example.com",
    index_closed_date_assignment_status: "Finished_2026-07-24",
  };
  const result = buildRevisitedAssignment(original, "event-1", event());
  assert.equal(result.record.assignment_id, "A-1");
  assert.equal(result.record.assignment_state, "On Progress");
  assert.equal(result.record.assignment_status, "Open");
  assert.equal(result.record.completed, false);
  assert.equal(result.record.completed_datetime, original.completed_datetime);
  assert.equal(result.record.closed_datetime, original.closed_datetime);
  assert.equal(result.revisitCount, 1);
  assert.equal(result.record.revisit_history["event-1"].reason, event().reason);
  assert.equal(result.record.index_created_date_assignment_state, "On Progress_2026-07-01");
  assert.equal(result.record.index_created_date_assignment_status, "Open_2026-07-01");
  assert.equal(result.record.index_created_date_completed, "false_2026-07-01");
  assert.equal(result.record.index_closed_date_assignment_status, "On Progress_2026-07-24");
  assert.equal(isCompletedAssignment(result.record), false);
});

test("subsequent revisit increments count and preserves every event", () => {
  const first = buildRevisitedAssignment(
    {
      assignment_id: "A",
      assignment_state: "Finished",
      completed: true,
      created_date: "2026-01-01",
    },
    "event-1",
    event(),
  );
  const completedAgain = {
    ...first.record,
    assignment_state: "Finished",
    assignment_status: "Completed",
    completed: true,
    completed_datetime: "2026-08-01 10:00:00",
  };
  const second = buildRevisitedAssignment(
    completedAgain,
    "event-2",
    event({ at: "2026-08-02 09:00:00", reason: "Additional correction." }),
  );
  assert.equal(second.revisitCount, 2);
  assert.deepEqual(Object.keys(second.record.revisit_history), ["event-1", "event-2"]);
});

test("service and transaction both enforce completed-only and retain one assignment", async () => {
  const service = await read("src/server/assignment/assignment-command-service.ts");
  const repository = await read("src/server/assignment/firebase-assignment-command-repository.ts");
  assert.ok(
    service.indexOf("isCompletedAssignment(current)") < service.indexOf("reserveRevisitKey"),
  );
  assert.match(service, /ASSIGNMENT_NOT_COMPLETED/);
  assert.match(service, /revisitReason\.length > 2000/);
  assert.match(repository, /\.transaction\(/);
  assert.match(repository, /buildRevisitedAssignment\(record, eventKey, event\)/);
  assert.match(repository, /if \(!isCompletedAssignment\(record\)\)/);
  assert.doesNotMatch(repository, /revisitAssignment[\s\S]{0,1200}reserveAssignmentKey/);
});

test("revisit API reuses authorization and validates a required bounded reason", async () => {
  const route = await read("src/app/api/assignments/[assignmentId]/revisit/route.ts");
  assert.ok(route.indexOf("resolveAssignmentActor") < route.indexOf("revisitAssignment"));
  assert.match(route, /z\.string\(\)\.trim\(\)\.min\(1\)\.max\(2000\)/);
  assert.match(route, /export async function POST/);
  assert.doesNotMatch(route, /client role|localStorage/i);
});

test("detail UI exposes completed-only confirmation, reason, history, and revisit metadata", async () => {
  const dialog = await read("src/components/assignment/assignment-revisit-dialog.tsx");
  const detail = await read("src/components/assignment/assignment-detail.tsx");
  assert.match(dialog, /isCompletedAssignment\(row\)/);
  assert.match(dialog, /Please enter the reason for revisiting this assignment/);
  assert.match(dialog, /required/);
  assert.match(dialog, /This action cannot be undone automatically/);
  assert.match(detail, /AssignmentTimeline/);
  assert.match(detail, /buildAssignmentTimeline/);
  assert.match(detail, /Revisit count/);
  assert.equal((detail.match(/AssignmentRevisitDialog row=\{row\}/g) || []).length, 2);
});
