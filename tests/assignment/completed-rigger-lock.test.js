import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  isCompletedAssignment,
  isRiggerAssignmentChange,
} from "../../src/features/assignment/assignment-command-contract.mjs";

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8");

const currentRigger = { rigger_name: "John Doe", rigger_email: "john@example.com" };

test("recognizes current, legacy, and officially reopened completion representations", () => {
  assert.equal(isCompletedAssignment({ assignment_status: "Completed" }), true);
  assert.equal(isCompletedAssignment({ assignment_status: " completed " }), true);
  assert.equal(isCompletedAssignment({ assignment_state: "Finished" }), true);
  assert.equal(isCompletedAssignment({ assignment_state: "Completed" }), true);
  assert.equal(isCompletedAssignment({ completed: true }), true);
  assert.equal(isCompletedAssignment({ completed: "true" }), true);
  assert.equal(isCompletedAssignment({ completed_datetime: "2026-07-25 10:30:00" }), true);
  assert.equal(isCompletedAssignment({ assignment_state: "Open", completed: false }), false);
  assert.equal(isCompletedAssignment({ assignment_state: "Rejected" }), false);
  assert.equal(
    isCompletedAssignment({
      assignment_state: "On Progress",
      assignment_status: "Open",
      completed: false,
      completed_datetime: "2026-07-25 10:30:00",
    }),
    false,
  );
});

test("detects only actual persisted Rigger changes", () => {
  assert.equal(
    isRiggerAssignmentChange(currentRigger, { name: "John Doe", email: " JOHN@EXAMPLE.COM " }),
    false,
  );
  assert.equal(
    isRiggerAssignmentChange(currentRigger, { name: "Jane Doe", email: "jane@example.com" }),
    true,
  );
  assert.equal(isRiggerAssignmentChange(currentRigger, null), true);
  assert.equal(
    isRiggerAssignmentChange({ rigger_name: "Legacy Rigger" }, { name: " legacy rigger " }),
    false,
  );
  assert.equal(
    isRiggerAssignmentChange({ rigger_name: "Legacy Rigger" }, { name: "Other Rigger" }),
    true,
  );
});

test("command service permits a no-op but rejects a completed Rigger change", async () => {
  const source = await read("src/server/assignment/assignment-command-service.ts");
  const userLookup = source.indexOf('this.repo.findUser(required(input.riggerKey, "Rigger"))');
  const actualChangeCheck = source.indexOf("isRiggerAssignmentChange(found.value, r)", userLookup);
  const update = source.indexOf("reassignRiggerByKey", actualChangeCheck);
  assert.ok(userLookup > -1 && userLookup < actualChangeCheck && actualChangeCheck < update);
  assert.match(source, /isCompletedAssignment\(found\.value\) &&/);
  assert.match(source, /ASSIGNMENT_COMPLETED/);
  assert.match(
    source,
    /Rigger cannot be reassigned because the assignment has already been completed\./,
  );
});

test("Firebase transaction checks latest identity and completion before any write", async () => {
  const source = await read("src/server/assignment/firebase-assignment-command-repository.ts");
  const method = source.slice(
    source.indexOf("async reassignRiggerByKey"),
    source.indexOf("async transitionAssignment"),
  );
  const comparison = method.indexOf("isRiggerAssignmentChange(record, input.rigger)");
  const completion = method.indexOf("isCompletedAssignment(record)");
  const update = method.indexOf("buildRiggerDependentFields(record, input.rigger)");
  assert.match(method, /\.transaction\(/);
  assert.ok(comparison > -1 && comparison < completion && completion < update);
  assert.match(method, /abortReason = "unchanged";\s*return;/);
  assert.match(method, /abortReason = "completed";\s*return;/);
  assert.match(method, /transaction\.committed/);
  assert.match(
    method,
    /\.ref\("assignment"\)[\s\S]*?\.child\(input\.assignmentKey\)[\s\S]*?\.transaction/,
  );
});

test("direct API retains authorization and the established HTTP 409 response", async () => {
  const route = await read("src/app/api/assignments/[assignmentId]/rigger/route.ts");
  const errors = await read("src/server/assignment/assignment-command-errors.ts");
  const api = await read("src/server/assignment/assignment-api.ts");
  assert.ok(route.indexOf("resolveAssignmentActor") < route.indexOf("reassignRigger"));
  assert.match(errors, /ASSIGNMENT_COMPLETED:\s*409/);
  assert.match(api, /code: error\.code, message: error\.message/);
  assert.match(api, /status: error\.status/);
});

test("shared reassignment UI renders a locked explanation and cannot open the dialog", async () => {
  const source = await read("src/components/assignment/assignment-reassign-rigger-dialog.tsx");
  assert.match(source, /isCompletedAssignment\(row\)/);
  assert.match(source, /Rigger Locked/);
  assert.match(
    source,
    /Rigger assignment cannot be changed because this assignment has been completed\./,
  );
  assert.match(source, /<Lock/);
  assert.ok(source.indexOf("isCompletedAssignment(row)") < source.indexOf("setOpen(true)"));
});

test("there is no existing bulk reassignment write path", async () => {
  const importService = await read("src/server/assignment/assignment-import-service.ts");
  const importRoute = await read("src/app/api/assignments/import/commit/route.ts");
  assert.doesNotMatch(importService, /bulkReassign|reassignAssignments/);
  assert.doesNotMatch(importRoute, /bulkReassign|reassignAssignments|updateRiggerIfMutable/);
});
