import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  ASSIGNMENT_TOWER_SNAPSHOT_FIELDS,
  assignmentSnapshotResultCsv,
  availableSnapshotBackfill,
  classifySnapshotAssignment,
  missingAssignmentSnapshotFields,
} from "../../src/features/assignment/assignment-tower-snapshot-contract.mjs";
const read = (path) => fs.readFileSync(path, "utf8");
test("backfill contract adds only missing available fields and preserves numeric zero", () => {
  const assignment = { tower_type: "OLD", assignment_state: "Open", owned: "keep" },
    tower = { tower_type: "NEW", tower_height: 0, total_rru: null, unrelated: "no" };
  assert.deepEqual(
    missingAssignmentSnapshotFields(assignment),
    ASSIGNMENT_TOWER_SNAPSHOT_FIELDS.filter((field) => field !== "tower_type"),
  );
  assert.deepEqual(availableSnapshotBackfill(assignment, tower), { tower_height: 0 });
  assert.equal(classifySnapshotAssignment(assignment), "eligible");
  assert.equal(classifySnapshotAssignment({ assignment_state: "Finished" }), "historical");
});
test("backfill CSV is BOM, CRLF, stable and formula protected", () => {
  const csv = assignmentSnapshotResultCsv([
    {
      assignmentKey: "=BAD",
      assignmentId: "A",
      towerKey: "T",
      towerId: "T1",
      status: "Open",
      classification: "repairable",
      missingFields: ["tower_height"],
      repairedFields: [],
      reason: "+unsafe",
    },
  ]);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.endsWith("\r\n"));
  assert.match(csv, /'=BAD/);
  assert.match(csv, /'\+unsafe/);
});
test("maintenance uses exact image source, classifies duplicates, and revalidates in root transactions", () => {
  const preview = read("src/app/api/admin/assignments/tower-snapshot-backfill/preview/route.ts"),
    commit = read("src/app/api/admin/assignments/tower-snapshot-backfill/commit/route.ts"),
    service = read("src/server/assignment/assignment-tower-snapshot-backfill-service.ts"),
    ui = read("src/components/admin/assignment-snapshot-maintenance.tsx");
  assert.match(preview, /resolveAdministrator/);
  assert.match(commit, /resolveAdministrator/);
  assert.match(service, /limitToLast\(ASSIGNMENT_SNAPSHOT_PREVIEW_LIMIT \+ 1\)/);
  assert.match(
    service,
    /ref\("image"\)[\s\S]*?orderByChild\("assignment_id"\)[\s\S]*?equalTo\(assignmentId\)/,
  );
  for (const classification of [
    "image_missing",
    "image_single_match",
    "image_duplicate_identical",
    "image_duplicate_conflicting",
  ])
    assert.match(service, new RegExp(classification));
  assert.match(service, /this\.db\.ref\(\)\.transaction/);
  assert.match(service, /full_tower_snapshot_backfill/);
  assert.match(service, /assignment_audit/);
  assert.match(service, /source_image_keys/);
  assert.doesNotMatch(service, /ref\("(?:tower|cell)"\)/);
  assert.match(service, /body\.confirmation\s*!==\s*ASSIGNMENT_SNAPSHOT_CONFIRMATION/);
  assert.match(ui, /disabled=\{busy/);
  assert.match(ui, /ASSIGNMENT_SNAPSHOT_CONFIRMATION/);
});
test("Full Tower backfill includes all exact Image-owned snapshot fields", () => {
  assert.deepEqual(ASSIGNMENT_TOWER_SNAPSHOT_FIELDS, [
    "tower_type",
    "tower_height",
    "total_antenna",
    "total_rru",
    "single_sector",
    "multi_sector",
    "route_distance",
    "justifikasi",
  ]);
  assert.deepEqual(
    availableSnapshotBackfill(
      { assignment_id: "A", tower_type: "keep" },
      { assignment_id: "A", tower_type: "replace", justifikasi: "ok", route_distance: "0" },
    ),
    { route_distance: "0", justifikasi: "ok" },
  );
});
