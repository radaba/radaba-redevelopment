import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  assignmentRiggerBaseline,
  changedAssignmentRiggerBaselineFields,
  isAssignmentFirebasePushKey,
  sameAssignmentRiggerBaseline,
} from "../../src/features/assignment/assignment-rigger-reassignment-contract.mjs";
const read = (path) => fs.readFileSync(path, "utf8");
test("baseline is stable for missing undefined blank and unrelated volatile fields", () => {
  const a = {
      assignment_id: "A",
      rigger_name: " Andi ",
      rigger_email: "a@example.invalid",
      assignment_state: "Open",
      completed: undefined,
      viewed_at: 1,
    },
    b = {
      assignment_id: "A",
      rigger_name: "Andi",
      rigger_email: "a@example.invalid",
      assignment_state: "Open",
      completed: null,
      viewed_at: 2,
    };
  assert.equal(sameAssignmentRiggerBaseline(a, assignmentRiggerBaseline(b)), true);
});
test("baseline uses established semantic normalization for protected legacy values", () => {
  assert.equal(
    sameAssignmentRiggerBaseline(
      {
        assignment_id: " A ",
        rigger_email: "RIGGER@EXAMPLE.INVALID ",
        assignment_state: " Open ",
        completed: false,
        completed_datetime: 1785466668,
      },
      {
        assignment_id: "A",
        rigger_email: "rigger@example.invalid",
        assignment_state: "Open",
        completed: "0",
        completed_datetime: "1785466668",
      },
    ),
    true,
  );
  assert.equal(
    sameAssignmentRiggerBaseline(
      { rigger_name: undefined, completed_datetime: null },
      { rigger_name: " ", completed_datetime: "" },
    ),
    true,
  );
});
test("changed fields report only protected semantic changes", () => {
  const baseline = {
    assignment_id: "A",
    rigger_name: "Andi",
    rigger_email: "a@example.invalid",
    assignment_state: "Open",
    assignment_status: "Assigned",
    completed: false,
    completed_datetime: null,
  };
  assert.deepEqual(
    changedAssignmentRiggerBaselineFields({ ...baseline, unrelated: "changed" }, baseline),
    [],
  );
  assert.deepEqual(
    changedAssignmentRiggerBaselineFields({ ...baseline, rigger_name: "Budi" }, baseline),
    ["rigger_name"],
  );
  assert.deepEqual(
    changedAssignmentRiggerBaselineFields({ ...baseline, assignment_state: "Finished" }, baseline),
    ["assignment_state"],
  );
  assert.deepEqual(
    changedAssignmentRiggerBaselineFields({ ...baseline, completed: true }, baseline),
    ["completed"],
  );
});
test("only Firebase push keys pass canonical mutation validation", () => {
  assert.equal(isAssignmentFirebasePushKey("-OyjBBg3HqfdfjcwnuHp"), true);
  for (const value of [
    "",
    undefined,
    null,
    "NPMXL_TWR-SAMPLE-001_073026_1785425605",
    "assignment/-OyjBBg3HqfdfjcwnuHp",
    "[object Object]",
  ])
    assert.equal(isAssignmentFirebasePushKey(value), false);
});
test("detail repository and mappers preserve key separately from business ID", () => {
  const repository = read("src/server/assignment/firebase-assignment-repository.ts"),
    mapper = read("src/features/assignment/assignment-mapper.mjs"),
    detail = read("src/features/assignment/assignment-detail.ts"),
    view = read("src/components/assignment/assignment-detail.tsx");
  assert.match(repository, /key: snapshot\.key \?\? key/);
  assert.match(mapper, /key: String\(key\)/);
  assert.match(mapper, /assignment_id: optionalText\(source\.assignment_id\)/);
  assert.match(detail, /assignmentKey,\s*assignmentId: text\(raw\.assignment_id\)/);
  assert.match(view, /assignmentKey=\{detail\.assignmentKey\}/);
});
test("reassignment uses push key transaction and never assignment_id as Assignment path", () => {
  const repository = read("src/server/assignment/firebase-assignment-command-repository.ts"),
    service = read("src/server/assignment/assignment-command-service.ts");
  assert.match(
    repository,
    /ref\("assignment"\)[\s\S]*?child\(input\.assignmentKey\)[\s\S]*?transaction/,
  );
  assert.doesNotMatch(repository, /child\(input\.assignmentId\)/);
  assert.match(service, /findByKey\(assignmentKey\)/);
  assert.doesNotMatch(service, /reassignRigger[\s\S]{0,700}findByAssignmentId/);
});
test("expected Image and Cell multiplicity is update-all, field-aware, and never Assignment ambiguity", () => {
  const repository = read("src/server/assignment/firebase-assignment-command-repository.ts");
  assert.match(
    repository,
    /ref\("image"\)\.orderByChild\("assignment_id"\)\.equalTo\(input\.assignmentId\)/,
  );
  assert.match(
    repository,
    /ref\("cell"\)\.orderByChild\("assignment_id"\)\.equalTo\(input\.assignmentId\)/,
  );
  assert.match(repository, /images\.forEach/);
  assert.match(repository, /cells\.forEach/);
  assert.match(repository, /Object\.hasOwn\(value, "rigger_name"\)/);
});
test("unclassified committed false is a transaction conflict, not a missing Assignment", () => {
  const repository = read("src/server/assignment/firebase-assignment-command-repository.ts");
  assert.match(repository, /let abortReason:[\s\S]*?= null/);
  assert.match(repository, /abortReason \?\? "transaction-conflict"/);
  const method = repository.slice(
    repository.indexOf("async reassignRiggerByKey"),
    repository.indexOf("async transitionAssignment"),
  );
  assert.doesNotMatch(method, /let outcome:[^\n]+ = "missing"/);
});
test("existing pre-read plus initial cached null never becomes assignment not found", () => {
  const repository = read("src/server/assignment/firebase-assignment-command-repository.ts");
  const method = repository.slice(
    repository.indexOf("async reassignRiggerByKey"),
    repository.indexOf("async transitionAssignment"),
  );
  assert.match(method, /const confirmedSnapshot = await assignmentRef\.get\(\)/);
  assert.match(method, /if \(!confirmedSnapshot\.exists\(\)\)[\s\S]*?outcome: "missing"/);
  assert.match(method, /const confirmedBaseline = assignmentRiggerBaseline\(confirmedRecord\)/);
  assert.match(
    method,
    /const record = \(currentIsNull \? confirmedRecord : current\) as RawAssignmentRecord/,
  );
  assert.doesNotMatch(method, /currentIsNull[\s\S]{0,100}(?:missing|assignment-not-found)/);
});
test("list mapper carries raw completed state into the dialog baseline", async () => {
  const { mapRawAssignmentToListItem } =
    await import("../../src/features/assignment/assignment-mapper.mjs");
  const row = mapRawAssignmentToListItem("key", { assignment_id: "A", completed: false });
  assert.equal(row.completed, false);
  assert.equal(assignmentRiggerBaseline(row).completed, false);
});
test("transaction uses shared semantic diff and conflict closes stale modal", () => {
  const repository = read("src/server/assignment/firebase-assignment-command-repository.ts");
  const dialog = read("src/components/assignment/assignment-reassign-rigger-dialog.tsx");
  const method = repository.slice(
    repository.indexOf("async reassignRiggerByKey"),
    repository.indexOf("async transitionAssignment"),
  );
  assert.match(method, /changedAssignmentRiggerBaselineFields\(\s*confirmedRecord/);
  assert.match(method, /changedAssignmentRiggerBaselineFields\(\s*record/);
  const conflict = dialog.slice(
    dialog.indexOf('body.code === "assignment_changed"'),
    dialog.indexOf('body.code === "invalid_assignment_key"'),
  );
  assert.match(conflict, /setOpen\(false\)/);
  assert.match(conflict, /setRigger\(null\)/);
  assert.ok(conflict.indexOf("setOpen(false)") < conflict.indexOf("router.refresh()"));
  assert.match(conflict, /Reopen Reassign Rigger/);
});
test("initial cached null uses the confirmed pre-read candidate inside the native transaction", () => {
  const repository = read("src/server/assignment/firebase-assignment-command-repository.ts");
  const method = repository.slice(
    repository.indexOf("async reassignRiggerByKey"),
    repository.indexOf("async transitionAssignment"),
  );
  assert.match(method, /const confirmedSnapshot = await assignmentRef\.get\(\)/);
  assert.match(method, /const transaction = await assignmentRef\.transaction\(/);
  assert.match(
    method,
    /const record = \(currentIsNull \? confirmedRecord : current\) as RawAssignmentRecord/,
  );
  assert.match(
    method,
    /return \{ \.\.\.record, \.\.\.buildRiggerDependentFields\(record, input\.rigger\) \}/,
  );
  assert.doesNotMatch(method, /currentIsNull\)[\s\S]{0,100}abortReason = "transaction-conflict"/);
  assert.doesNotMatch(method, /assignmentRef\.(?:set|update)\(/);
  assert.match(method, /undefined,\s*false,/);
});
test("transaction retry rechecks protected fields and preserves unrelated candidate data", () => {
  const repository = read("src/server/assignment/firebase-assignment-command-repository.ts");
  const method = repository.slice(
    repository.indexOf("async reassignRiggerByKey"),
    repository.indexOf("async transitionAssignment"),
  );
  assert.match(method, /changedAssignmentRiggerBaselineFields\(\s*record,\s*confirmedBaseline/);
  assert.match(method, /transactionChangedFields\.length/);
  assert.match(method, /return \{ \.\.\.record,/);
  assert.match(method, /if \(!transaction\.committed\)/);
  assert.match(method, /if \(!before \|\| !transaction\.snapshot\.exists\(\)\)/);
  assert.ok(method.indexOf("if (!transaction.committed)") < method.indexOf('ref("image")'));
});
test("transaction conflict closes and resets the stale reassignment modal", () => {
  const dialog = read("src/components/assignment/assignment-reassign-rigger-dialog.tsx");
  const conflict = dialog.slice(
    dialog.indexOf('body.code === "transaction_conflict"'),
    dialog.indexOf('body.code === "assignment_identity_mismatch"'),
  );
  assert.match(conflict, /setOpen\(false\)/);
  assert.match(conflict, /setRigger\(null\)/);
  assert.match(conflict, /router\.refresh\(\)/);
  assert.match(conflict, /Reopen Reassign Rigger/);
});
test("route awaits the push-key parameter and body Assignment ID is display identity only", () => {
  const route = read("src/app/api/assignments/[assignmentId]/rigger/route.ts"),
    dialog = read("src/components/assignment/assignment-reassign-rigger-dialog.tsx");
  assert.match(route, /const \{ assignmentId: assignmentKeyParameter \} = await params/);
  assert.match(route, /assignmentKey,\s*assignmentId: body\.data\.assignmentId/);
  assert.match(dialog, /fetch\(requestUrl/);
  assert.match(dialog, /encodeURIComponent\(assignmentKey\)/);
  assert.match(dialog, /router\.refresh\(\)/);
  assert.doesNotMatch(dialog, /router\.(?:push|replace)\(/);
});
test("audit and UI preserve partner and unrelated Assignment fields", () => {
  const repository = read("src/server/assignment/firebase-assignment-command-repository.ts"),
    ui = read("src/components/assignment/assignment-reassign-rigger-dialog.tsx");
  assert.match(repository, /reason: "rigger_reassignment"/);
  assert.match(repository, /image_records_updated/);
  assert.match(repository, /cell_records_updated/);
  assert.match(repository, /return \{ \.\.\.record, \.\.\.buildRiggerDependentFields/);
  assert.doesNotMatch(repository, /company:\s*input\.rigger/);
  assert.match(ui, /Assignment partner[\s\S]*?remains unchanged/);
});
