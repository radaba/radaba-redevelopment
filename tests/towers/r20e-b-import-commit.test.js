import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { towerImportResultCsv } from "../../src/features/tower/tower-transfer-contract.mjs";
const read = (path) => fs.readFileSync(path, "utf8");
const service = () => read("src/server/tower/tower-transfer-commit-service.ts");
test("commit route independently authorizes and reparses the original bounded CSV", () => {
  const route = read("src/app/api/towers/import/commit/route.ts");
  for (const pattern of [
    /resolveAdministrator\(\)/,
    /readTowerPreviewFile\(request\)/,
    /TowerTransferCommitService/,
    /towerAuditActor\(user\)/,
    /private, no-store/,
  ])
    assert.match(route, pattern);
  assert.doesNotMatch(route, /request\.json|client.*classification/i);
});
test("server revalidates exact matches and blocks invalid duplicate and ambiguous rows", () => {
  const source = service();
  assert.match(source, /boundedEntries\(TOWER_MATCH_SCAN_LIMIT\)/);
  assert.match(source, /previewTowerRows\(parsed,existing\.entries\)/);
  assert.match(source, /\["invalid","duplicate","ambiguous"\]/);
  assert.match(source, /result:"blocked"/);
  assert.doesNotMatch(source, /fuzzy|startsWith\(.*tower/i);
});
test("new Towers reuse create validation push keys duplicate protection zero-safe records and atomic import audit", () => {
  const source = service();
  for (const pattern of [
    /parseTowerCreateInput/,
    /value!==""/,
    /reserveKey\(\)/,
    /reserveAuditKey\(key\)/,
    /createIfTowerIdAvailable/,
    /tower_imported/,
    /bulk_import/,
    /tower_already_exists/,
  ])
    assert.match(source, pattern);
  assert.doesNotMatch(source, /value\s*\|\|\s*0/);
});
test("existing Towers are reread diffed changed-field-only and protected by optimistic concurrency", () => {
  const source = service();
  for (const pattern of [
    /findByKey\(key\)/,
    /previewTowerRows\(\{headers:parsed\.headers,rows:\[source\]\}/,
    /latest\.differences/,
    /updateFieldsWithAudit\(key,updates,expected,audit\)/,
    /tower_updated/,
    /stale_conflict/,
  ])
    assert.match(source, pattern);
  assert.match(
    read("src/features/tower/tower-transfer-contract.mjs"),
    /if \(field === "tower_id"\) continue/,
  );
});
test("each mutation uses the existing atomic Tower and audit repository operations", () => {
  const repository = read("src/server/tower/firebase-tower-command-repository.ts"),
    source = service();
  for (const method of ["createIfTowerIdAvailable", "updateFieldsWithAudit"]) {
    assert.match(source, new RegExp(method));
    const section = repository.slice(repository.indexOf(`async ${method}`));
    assert.match(section, /database\.ref\(\)\.transaction/);
    assert.match(section, /TOWER_RTDB_PATH/);
    assert.match(section, /TOWER_AUDIT_PATH/);
  }
  assert.doesNotMatch(source, /\.set\(|\.remove\(/);
});
test("batch processing is bounded sequential and returns deterministic partial results", () => {
  const source = service();
  assert.match(source, /for\(const row of preview\.rows\)/);
  for (const status of ["created", "updated", "unchanged", "blocked", "conflict", "failed"])
    assert.match(source, new RegExp(`"${status}"`));
  assert.match(source, /totalRows:results\.length/);
  assert.doesNotMatch(source, /Promise\.all\(preview\.rows|unlimited/i);
});
test("browser retries cannot duplicate a Tower ID", () => {
  const source = service(),
    repository = read("src/server/tower/firebase-tower-command-repository.ts");
  assert.match(source, /createIfTowerIdAvailable/);
  assert.match(repository, /Object\.entries\(records\)\.find/);
  assert.match(repository, /tower_id/);
  assert.match(source, /result:"conflict"/);
});
test("UI requires exact phrase prevents double submit and reports partial outcomes with Firebase-key links", () => {
  const source = read("src/components/tower/tower-import-export-page.tsx");
  for (const pattern of [
    /phrase!=="IMPORT TOWERS"/,
    /if\(!file\|\|busy/,
    /disabled=\{busy\|\|phrase!=="IMPORT TOWERS"\}/,
    /Import partially completed/,
    /created/,
    /updated/,
    /unchanged/,
    /blocked/,
    /conflicts/,
    /failed/,
    /encodeURIComponent\(row\.firebaseKey\)/,
  ])
    assert.match(source, pattern);
});
test("result CSV is BOM UTF-8 stable and formula protected", () => {
  const output = towerImportResultCsv([
    {
      rowNumber: 2,
      towerId: "=BAD",
      firebaseKey: "-Nkey",
      result: "failed",
      changedFields: ["sitename"],
      errorCode: "bad",
      message: "+unsafe",
    },
  ]);
  assert.ok(
    output.startsWith("\uFEFFrow,tower_id,firebase_key,result,changed_fields,error_code,message"),
  );
  assert.match(output, /'=BAD/);
  assert.match(output, /'\+unsafe/);
  assert.match(output, /-Nkey/);
});
test("scope excludes delete archive restore merge and schema migration", () => {
  const source = service() + read("src/app/api/towers/import/commit/route.ts");
  for (const pattern of [
    /remove\(/,
    /delete/i,
    /archive/i,
    /restore/i,
    /merge/i,
    /tower_id_index|schema migration/i,
  ])
    assert.doesNotMatch(source, pattern);
});
test("an imported Tower keeps tower_id separate from its Firebase key through immediate edit", () => {
  const source = service(),
    importUi = read("src/components/tower/tower-import-export-page.tsx"),
    page = read("src/app/home/towers/[towerKey]/page.tsx"),
    workspace = read("src/components/tower-workspace/tower-operations-workspace.tsx"),
    dialog = read("src/components/tower/tower-edit-dialog.tsx"),
    towerId = "TWR-SAMPLE-001",
    firebaseKey = "-OTestImportedTowerKey001";
  assert.notEqual(towerId, firebaseKey);
  assert.match(source, /firebaseKey:key/);
  assert.match(importUi, /encodeURIComponent\(row\.firebaseKey\)/);
  assert.match(page, /TowerOperationsWorkspace towerKey=\{towerKey\}/);
  assert.match(workspace, /editableTower\s*=\s*mapTower\(towerKey,\s*tower\)/);
  assert.match(dialog, /encodeURIComponent\(tower\.firebaseKey\)/);
  const detailUrl = `/home/towers/${encodeURIComponent(firebaseKey)}`,
    patchUrl = `/api/towers/${encodeURIComponent(firebaseKey)}`;
  assert.equal(detailUrl, "/home/towers/-OTestImportedTowerKey001");
  assert.equal(patchUrl, "/api/towers/-OTestImportedTowerKey001");
  assert.notEqual(detailUrl, `/home/towers/${towerId}`);
  assert.notEqual(patchUrl, `/api/towers/${towerId}`);
});
test("missing Firebase keys disable imported navigation and editing without a tower_id fallback", () => {
  const importUi = read("src/components/tower/tower-import-export-page.tsx"),
    dialog = read("src/components/tower/tower-edit-dialog.tsx");
  assert.match(importUi, /row\.firebaseKey\?<Link/);
  assert.match(importUi, /Unavailable: Firebase key missing/);
  assert.doesNotMatch(importUi, /encodeURIComponent\(row\.towerId\)/);
  assert.match(dialog, /const keyValid=/);
  assert.match(dialog, /disabled=\{!keyValid\}/);
  assert.match(dialog, /if\(!keyValid\)/);
  assert.doesNotMatch(dialog, /encodeURIComponent\(tower\.tower_id\)/);
});
