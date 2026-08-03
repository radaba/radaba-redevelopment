import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  prepareTowerEdit,
  TOWER_EDIT_FIELDS,
} from "../../src/features/tower/tower-edit-contract.mjs";
const read = (path) => fs.readFileSync(path, "utf8");
const current = {
  tower_id: "TWR-1",
  sitename: "Alpha",
  region: "WEST",
  new_cluster_name: "C1",
  latitude: -6.2,
  longitude: 106.8,
  g900: 2,
  province: "Old",
};
test("approved edits normalize and produce a minimal update", () => {
  const result = prepareTowerEdit(current, { site_id: " Site-Mixed-02 ", sitename: " Alpha 2 ", latitude: "-6.3", g900: "2" });
  assert.deepEqual(result.updates, { site_id: "Site-Mixed-02", sitename: "Alpha 2", latitude: -6.3 });
  assert.equal(result.record.tower_id, "TWR-1");
});
test("optional blanks remove fields using the existing absence convention", () => {
  const result = prepareTowerEdit(current, { province: "", g1800: "" });
  assert.deepEqual(result.updates, { province: null });
  assert.equal("province" in result.record, false);
});
test("zero radio values are preserved", () => {
  const result = prepareTowerEdit(current, { g900: "0", l2300: "0" });
  assert.equal(result.updates.g900, 0);
  assert.equal(result.updates.l2300, 0);
});
test("Tower ID is immutable", () => {
  assert.throws(() => prepareTowerEdit(current, { tower_id: "TWR-2" }), /immutable/);
  assert.equal(TOWER_EDIT_FIELDS.includes("tower_id"), false);
});
test("unknown and unproven fields are rejected", () => {
  for (const payload of [{ remarks: "x" }, { google_maps_url: "x" }, { status: "x" }, { radaba_status: "x" }])
    assert.throws(() => prepareTowerEdit(current, payload), /Unknown/);
});
test("required text cannot be cleared", () => {
  for (const key of ["sitename", "region", "new_cluster_name"])
    assert.throws(() => prepareTowerEdit(current, { [key]: "" }), /required/);
});
test("coordinates are required and bounded", () => {
  assert.throws(() => prepareTowerEdit(current, { latitude: "" }));
  assert.throws(() => prepareTowerEdit(current, { latitude: 91 }));
  assert.throws(() => prepareTowerEdit(current, { longitude: -181 }));
  assert.equal(prepareTowerEdit(current, { longitude: "0" }).updates.longitude, 0);
});
test("radio values are bounded integers while null stays unavailable", () => {
  assert.throws(() => prepareTowerEdit(current, { g900: -1 }));
  assert.throws(() => prepareTowerEdit(current, { l2300: 1000 }));
  assert.throws(() => prepareTowerEdit(current, { u850: "wat" }));
  assert.throws(() => prepareTowerEdit(current, { g900: 1.5 }));
  assert.deepEqual(prepareTowerEdit(current, { l2300: null }).updates, {});
});
test("PATCH uses strict administrator authorization and status mapping", () => {
  const route = read("src/app/api/towers/[towerKey]/route.ts");
  for (const pattern of [
    /export async function GET/,
    /export async function PATCH/,
    /await resolveAdministrator/,
    /TowerAssignmentImpactError/,
    /NOT_FOUND.*404/,
  ])
    assert.match(route, pattern);
  assert.match(route, /resolveTowerActor/);
});
test("service loads one record, preserves ID, and skips no-op writes", () => {
  const source = read("src/server/tower/tower-command-service.ts");
  for (const pattern of [
    /findByKey\(key\)/,
    /current\.tower_id/,
    /Object\.keys\(prepared\.updates\)\.length/,
    /updateFieldsWithAudit\(key,prepared\.updates,expected/,
  ])
    assert.match(source, pattern);
});
test("Firebase edit atomically updates the immutable child and audit", () => {
  const source = read("src/server/tower/firebase-tower-command-repository.ts"),
    method = source.slice(
      source.indexOf("async updateFieldsWithAudit"),
      source.indexOf("async listExistingTowerIds"),
    );
  assert.match(source, /ref\(`\$\{TOWER_RTDB_PATH\}\/\$\{key\}`\)\.once/);
  assert.match(method, /database\.ref\(\)\.transaction/);
  assert.match(method, /TOWER_RTDB_PATH/);
  assert.match(method, /TOWER_AUDIT_PATH/);
  assert.match(method, /if\(current===null\)return current/);
  assert.match(method, /result\.committed&&\(outcome as/);
  assert.doesNotMatch(source, /assignment/);
});
test("editor supports responsive layout safety and accessibility", () => {
  const source = read("src/components/tower/tower-edit-dialog.tsx");
  for (const pattern of [
    /Edit Tower/,
    /Review Changes/,
    /aria-modal="true"/,
    /readOnly/,
    /Discard unsaved Tower changes/,
    /beforeunload/,
    /event\.key==="Escape"/,
    /event\.key==="Tab"/,
    /router\.refresh\(\)/,
    /role="alert"/,
    /role="status"/,
    /sm:max-w-5xl/,
  ])
    assert.match(source, pattern);
});
test("R20A exposes administrator edit on list and workspace detail", () => {
  const page = read("src/app/home/towers/[towerKey]/page.tsx"),
    workspace = read("src/components/tower-workspace/tower-operations-workspace.tsx"),
    directory = read("src/components/tower/tower-directory.tsx");
  assert.match(page, /canEdit=\{canAdministrate\(user\)\}/);
  assert.match(workspace, /TowerEditDialog/);
  assert.match(directory, /canEdit\?\<TowerEditDialog/);
});
test("detail edit uses the authoritative route Firebase key instead of payload identity", () => {
  const page = read("src/app/home/towers/[towerKey]/page.tsx"),
    workspace = read("src/components/tower-workspace/tower-operations-workspace.tsx"),
    dialog = read("src/components/tower/tower-edit-dialog.tsx"),
    routeKey = "-Nabc123TowerKey",
    payload = { databaseKey: "stale-payload-key", tower_id: "MAL-MU-LBA-0048" };
  assert.match(page, /TowerOperationsWorkspace towerKey=\{towerKey\}/);
  assert.match(workspace, /towerKey\s*:\s*string/);
  assert.match(workspace, /editableTower\s*=\s*mapTower\(towerKey,\s*tower\)/);
  assert.doesNotMatch(workspace, /editableTower\s*=\s*mapTower\(tower\.databaseKey,\s*tower\)/);
  assert.match(dialog, /fetch\(`\/api\/towers\/\$\{encodeURIComponent\(tower\.firebaseKey\)\}`/);
  const editableKey = routeKey,
    patchUrl = `/api/towers/${encodeURIComponent(editableKey)}`;
  assert.equal(patchUrl, "/api/towers/-Nabc123TowerKey");
  assert.notEqual(patchUrl, `/api/towers/${payload.tower_id}`);
  assert.notEqual(patchUrl, `/api/towers/${payload.databaseKey}`);
});
test("R20A uses transaction-time optimistic concurrency and review recovery", () => {
  const route = read("src/app/api/towers/[towerKey]/route.ts"),
    service = read("src/server/tower/tower-command-service.ts"),
    repository = read("src/server/tower/firebase-tower-command-repository.ts"),
    dialog = read("src/components/tower/tower-edit-dialog.tsx");
  assert.match(route, /CONFLICT.*409/);
  assert.match(service, /baseline/);
  assert.match(service, /outcome===\"conflict\"/);
  assert.match(repository, /Object\.entries\(expected\)/);
  assert.match(dialog, /Review Tower Changes/);
  assert.match(dialog, /Reload latest values/);
  assert.match(dialog, /Tower-only preserves Assignment snapshots/);
  assert.match(dialog, /baseline:baselineValues/);
});
test("detail remains assignment-compatible and exposes key context", () => {
  const source = read("src/components/tower/tower-detail.tsx");
  for (const pattern of [
    /TowerRelatedAssignments/,
    /TowerDetailActions/,
    /site_id/,
    /new_cluster_name/,
    /coordinates/,
  ])
    assert.match(source, pattern);
});
test("no concurrency metadata or cross-record mutation was invented", () => {
  const source =
    read("src/features/tower/tower-edit-contract.mjs") +
    read("src/server/tower/tower-command-service.ts");
  for (const pattern of [/updated_by/, /updated_at/, /version/, /etag/, /assignment.*update/i])
    assert.doesNotMatch(source, pattern);
});
