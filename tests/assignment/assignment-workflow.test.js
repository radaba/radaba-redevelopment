import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  isCompletedAssignment,
  buildRevisitedAssignment,
} from "../../src/features/assignment/assignment-command-contract.mjs";
import { buildAssignmentTimeline } from "../../src/features/assignment/assignment-timeline.mjs";
import {
  ASSIGNMENT_STATES,
  availableAssignmentTransitions,
  buildAssignmentTransition,
  normalizeAssignmentState,
} from "../../src/features/assignment/assignment-workflow.mjs";

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8");
const timestamp = { date: "2026-07-25", datetime: "2026-07-25 09:42:00" };
const actor = { uid: "uid-1", name: "John Doe" };

test("centralizes the confirmed seven-state model without unsupported strings", () => {
  assert.deepEqual(ASSIGNMENT_STATES, [
    "Open",
    "Accepted",
    "On Progress",
    "Paused",
    "Finished",
    "Rejected",
    "Dropped",
  ]);
  assert.equal(normalizeAssignmentState(" on progress "), "On Progress");
  for (const unsupported of ["Completed", "Resumed", "Travelling", "Testing"])
    assert.equal(normalizeAssignmentState(unsupported), null);
});

test("exposes only approved current-state actions with Complete before Pause", () => {
  assert.deepEqual(availableAssignmentTransitions({ assignment_state: "Open" }), ["accept"]);
  assert.deepEqual(availableAssignmentTransitions({ assignment_state: "Accepted" }), ["start"]);
  assert.deepEqual(availableAssignmentTransitions({ assignment_state: "Paused" }), ["resume"]);
  assert.deepEqual(availableAssignmentTransitions({ assignment_state: "On Progress" }), [
    "complete",
    "pause",
  ]);
  for (const state of ["Finished", "Rejected", "Dropped"])
    assert.deepEqual(availableAssignmentTransitions({ assignment_state: state }), []);
});

test("Accept and Start Work retain their existing field contracts", () => {
  assert.deepEqual(
    buildAssignmentTransition(
      { assignment_state: "Open", created_date: "2026-07-20" },
      "accept",
      timestamp,
      actor,
    ),
    {
      assignment_state: "Accepted",
      accepted_date: timestamp.date,
      accepted_datetime: timestamp.datetime,
      index_created_date_assignment_state: "Accepted_2026-07-20",
      index_created_date_assignment_status: "Accepted_2026-07-20",
    },
  );
  assert.equal(
    buildAssignmentTransition({ assignment_state: "Open" }, "start", timestamp, actor),
    null,
  );
});

test("Paused Assignment resumes without overwriting pause or work-start evidence", () => {
  const original = {
    assignment_state: "Paused",
    assignment_status: "Open",
    completed: false,
    created_date: "2026-07-20",
    checkin_date: "2026-07-21",
    checkin_datetime: "2026-07-21 08:00:00",
    paused_date: "2026-07-22",
    paused_datetime: "2026-07-22 12:00:00",
  };
  const fields = buildAssignmentTransition(original, "resume", timestamp, actor);
  assert.deepEqual(fields, {
    assignment_state: "On Progress",
    index_created_date_assignment_state: "On Progress_2026-07-20",
    index_created_date_assignment_status: "On Progress_2026-07-20",
  });
  assert.equal(Object.hasOwn(fields, "resumed_datetime"), false);
  assert.equal(Object.hasOwn(fields, "checkin_datetime"), false);
  assert.equal(Object.hasOwn(fields, "paused_datetime"), false);
  for (const state of ["Open", "Accepted", "On Progress", "Finished"])
    assert.equal(
      buildAssignmentTransition({ assignment_state: state }, "resume", timestamp, actor),
      null,
    );
});

test("On Progress completes with canonical legacy fields, actor, and composites", () => {
  const fields = buildAssignmentTransition(
    {
      assignment_state: "On Progress",
      assignment_status: "Open",
      completed: false,
      created_date: "2026-07-20",
      rigger_email: "rigger@example.com",
      assignment_id: "A-1",
      tower_id: "T-1",
    },
    "complete",
    timestamp,
    actor,
  );
  assert.deepEqual(fields, {
    assignment_state: "Finished",
    index_created_date_assignment_state: "Finished_2026-07-20",
    index_created_date_assignment_status: "Finished_2026-07-20",
    completed_date: timestamp.date,
    completed_datetime: timestamp.datetime,
    assignment_status: "Completed",
    completed: true,
    completed_by_uid: actor.uid,
    completed_by_name: actor.name,
    index_created_date_completed: "true_2026-07-20",
    rigger_email_assignment_status_assignment_id: "rigger@example.com_Completed_A-1",
    rigger_email_assignment_status_tower_id: "rigger@example.com_Completed_T-1",
  });
  assert.equal(isCompletedAssignment({ ...fields }), true);
  for (const state of ["Open", "Accepted", "Paused", "Finished", "Rejected", "Dropped"])
    assert.equal(
      buildAssignmentTransition({ assignment_state: state }, "complete", timestamp, actor),
      null,
    );
});

test("completion requires a trusted actor and creates exactly one timeline event", () => {
  assert.throws(
    () => buildAssignmentTransition({ assignment_state: "On Progress" }, "complete", timestamp),
    /Completion actor/,
  );
  const events = buildAssignmentTimeline({
    createdDateTime: null,
    acceptedDateTime: null,
    checkinDateTime: null,
    pausedDateTime: null,
    completedDateTime: timestamp.datetime,
    rejectedDateTime: null,
    closedDateTime: null,
    operatorName: null,
    riggerName: "Assigned Rigger",
    completedByName: actor.name,
    coordinatorName: null,
    category: null,
    rejectedReason: null,
    revisitHistory: [
      {
        at: "2026-07-26 10:00:00",
        byName: "Admin",
        reason: "More work",
        previousStatus: "Finished",
        newStatus: "On Progress",
        previousCompletedAt: timestamp.datetime,
      },
    ],
  });
  assert.equal(events.filter((event) => event.type === "completed").length, 1);
  assert.equal(events.find((event) => event.type === "completed").actor, actor.name);
});

test("completed output remains compatible with Revisit", () => {
  const completed = {
    assignment_id: "A-1",
    assignment_state: "Finished",
    assignment_status: "Completed",
    completed: true,
    completed_datetime: timestamp.datetime,
    created_date: "2026-07-20",
    rigger_email: "rigger@example.com",
  };
  const revisited = buildRevisitedAssignment(completed, "event-1", {
    action: "Assignment Revisited",
    at: "2026-07-26 10:00:00",
    by_uid: "uid-2",
    by_name: "Admin",
    reason: "Additional work",
    previous_status: "Finished",
    new_status: "On Progress",
    previous_completed_at: timestamp.datetime,
  });
  assert.equal(revisited.record.assignment_state, "On Progress");
  assert.equal(revisited.record.assignment_status, "Open");
  assert.equal(revisited.record.completed, false);
});

test("service and transaction use latest state, actor, and one atomic write", async () => {
  const service = await read("src/server/assignment/assignment-command-service.ts");
  const repository = await read("src/server/assignment/firebase-assignment-command-repository.ts");
  assert.ok(
    service.indexOf("availableAssignmentTransitions(found[0].value)") <
      service.indexOf("this.repo.transitionAssignment"),
  );
  assert.match(service, /jakartaParts\(this\.now\(\)\)/);
  assert.match(service, /ASSIGNMENT_INVALID_TRANSITION/);
  const method = repository.slice(repository.indexOf("async transitionAssignment"));
  assert.match(method, /\.transaction\(/);
  assert.ok(
    method.indexOf("buildAssignmentTransition(record, action, timestamp, actor)") <
      method.indexOf("return { ...record, ...fields }"),
  );
  assert.match(method, /outcome = "invalid-transition";\s*return;/);
  assert.doesNotMatch(method, /\.update\(|\.set\(/);
});

test("transition API authorizes first and accepts only bounded actions", async () => {
  const route = await read("src/app/api/assignments/[assignmentId]/transition/route.ts");
  assert.ok(route.indexOf("resolveAssignmentActor") < route.indexOf("transitionAssignment"));
  assert.match(route, /z\.enum\(\["accept", "start", "resume", "complete", "pause"\]\)/);
  assert.match(route, /uid: actor\.uid/);
  assert.match(route, /name: actor\.name/);
  assert.doesNotMatch(route, /assignment_state|assignment_status|completed_datetime/);
});

test("detail UI shows Resume and prioritizes Complete over Pause", async () => {
  const actions = await read("src/components/assignment/assignment-workflow-actions.tsx");
  const detail = await read("src/components/assignment/assignment-detail.tsx");
  for (const label of [
    "Accept Assignment",
    "Start Work",
    "Resume Work",
    "Complete Assignment",
    "Pause Work",
  ])
    assert.match(actions, new RegExp(label));
  assert.ok(actions.indexOf("complete: {") < actions.indexOf("pause: {"));
  assert.match(actions, /Assignment ID/);
  assert.match(actions, /Tower ID/);
  assert.match(actions, /Current status/);
  assert.match(actions, /Target status/);
  assert.match(actions, /aria-live="polite"/);
  assert.match(actions, /router\.refresh\(\)/);
  assert.equal(
    (detail.match(/AssignmentWorkflowActions row=\{row\} towerId=\{detail\.towerId\}/g) || [])
      .length,
    2,
  );
});

test("existing timeline fields remain unchanged and Resume is not fabricated", async () => {
  const timeline = await read("src/features/assignment/assignment-timeline.mjs");
  assert.match(timeline, /detail\.acceptedDateTime/);
  assert.match(timeline, /detail\.checkinDateTime/);
  assert.match(timeline, /detail\.pausedDateTime/);
  assert.match(timeline, /detail\.completedDateTime/);
  assert.doesNotMatch(timeline, /Work Resumed|resumedDateTime/);
});
