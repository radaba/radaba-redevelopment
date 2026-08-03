import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  buildTowerWorkspace,
  groupTowerCells,
  towerCoordinates,
} from "../../src/features/tower-workspace/tower-workspace-contract.mjs";
const cell = (databaseKey, sector, band, extra = {}) => ({
  databaseKey,
  sector,
  band,
  rcell_id: `rcell-${databaseKey}`,
  assignment_id: "A-1",
  ...extra,
});
test("groups numeric sectors and stable radio bands without merging records", () => {
  const groups = groupTowerCells([
    cell("a", "10", "l850"),
    cell("b", "2", "l1800"),
    cell("c", "2", "g900"),
    cell("d", "2", "l850"),
  ]);
  assert.deepEqual(
    groups.map((x) => x.sector),
    ["2", "10"],
  );
  assert.deepEqual(
    groups[0].cells.map((x) => x.band),
    ["g900", "l850", "l1800"],
  );
  assert.equal(groups.flatMap((x) => x.cells).length, 4);
});
test("keeps missing sector and band plus duplicate business identifiers distinct", () => {
  const cells = [
    cell("key-a", null, null, { rcell_id: "duplicate" }),
    cell("key-b", null, null, { rcell_id: "duplicate" }),
  ];
  const workspace = buildTowerWorkspace({
    tower: { databaseKey: "tower", tower_id: "T-1" },
    assignments: [],
    cells,
  });
  assert.equal(workspace.groupedSectors[0].sector, "Unspecified");
  assert.deepEqual(
    workspace.cells.map((x) => x.databaseKey),
    ["key-a", "key-b"],
  );
  assert.ok(workspace.warnings.some((x) => x.code === "duplicate-rcell-id"));
  assert.ok(workspace.warnings.some((x) => x.code === "duplicate-sector-band"));
});
test("validates coordinate variants and ranges", () => {
  assert.deepEqual(towerCoordinates({ latitude: "-6.2", longitude: 106.8 }), {
    latitude: -6.2,
    longitude: 106.8,
  });
  assert.equal(towerCoordinates({ latitude: 91, longitude: 0 }), null);
  assert.equal(towerCoordinates({ latitude: "bad", longitude: 0 }), null);
});
test("normalizes Tower and Cell images once and reports incomplete or unknown pairs", () => {
  const workspace = buildTowerWorkspace({
    tower: { databaseKey: "tower", tower_id: "T-1", foto_tower_height_name: "tower.jpg" },
    assignments: [{ key: "a", assignment_id: "A-1" }],
    cells: [cell("cell", "1", "l850", { foto_custom_url: "https://example.invalid/x" })],
  });
  assert.equal(workspace.towerImages.length, 1);
  assert.equal(workspace.cellImages.length, 1);
  assert.ok(workspace.warnings.some((x) => x.code === "missing-url"));
  assert.ok(workspace.warnings.some((x) => x.code === "missing-name"));
  assert.ok(workspace.warnings.some((x) => x.code === "unclassified-image"));
});
test("reports unresolved Assignment, sector contradiction and conflicting people", () => {
  const workspace = buildTowerWorkspace({
    tower: {
      databaseKey: "tower",
      tower_id: "T-1",
      single_sector: true,
      multi_sector: true,
      rigger_name: "One",
      rigger_email: "same@test",
    },
    cells: [cell("cell", "1", "g900", { rigger_name: "Two", rigger_email: "same@test" })],
  });
  assert.ok(workspace.warnings.some((x) => x.code === "missing-assignment"));
  assert.ok(workspace.warnings.some((x) => x.code === "sector-mode-contradiction"));
  assert.ok(workspace.warnings.some((x) => x.code === "conflicting-person"));
});
test("timeline contains only populated recorded timestamps", () => {
  const workspace = buildTowerWorkspace({
    tower: { databaseKey: "tower", tower_id: "T-1", created_datetime: "2026-01-01" },
    assignments: [{ key: "a", assignment_id: "A-1", created_datetime: "2025-12-31" }],
    cells: [cell("cell", "1", "g900", { closed_datetime: "2026-01-02" })],
  });
  assert.deepEqual(
    workspace.timeline.map((x) => x.label),
    ["Cell closed", "Tower visit submitted", "Assignment created"],
  );
});
test("repository source uses direct bounded reads and no writes", () => {
  const source = fs.readFileSync(
    "src/server/tower-workspace/firebase-tower-workspace-repository.ts",
    "utf8",
  );
  assert.match(source, /child\(towerKey\)/);
  assert.match(source, /limitToFirst\(CELL_LIMIT\)/);
  assert.match(source, /findRecentByTowerId\(towerId,20\)/);
  assert.doesNotMatch(source, /database\.ref[^;]+\.(?:set|update|push|transaction)\(/s);
});
test("UI includes protected states, matrix, mobile cards, images, timeline, quality and navigation", () => {
  const page = fs.readFileSync("src/app/home/towers/[towerKey]/page.tsx", "utf8");
  const ui = fs.readFileSync(
    "src/components/tower-workspace/tower-operations-workspace.tsx",
    "utf8",
  );
  const loading = fs.readFileSync("src/app/home/towers/[towerKey]/loading.tsx", "utf8");
  assert.match(page, /canAccessAssignment/);
  assert.match(page, /notFound/);
  assert.match(page, /authorized/);
  for (const term of [
    "Sectors & Cells",
    "SectorTable",
    "SectorCards",
    "Tower Images",
    "Cell Images",
    "Recorded Timestamps",
    "Data Quality",
    "View Cell",
    "View All Images",
  ])
    assert.match(ui, new RegExp(term));
  assert.match(loading, /sector matrix/);
});

test("Tower Detail omits Tower specification while preserving the workspace and RTDB read contract", () => {
  const ui = fs.readFileSync(
    "src/components/tower-workspace/tower-operations-workspace.tsx",
    "utf8",
  );
  const repository = fs.readFileSync(
    "src/server/tower-workspace/firebase-tower-workspace-repository.ts",
    "utf8",
  );
  for (const removed of [
    "Tower specification",
    "Tower type",
    "Tower height",
    "Total antenna",
    "Total RRU",
    "Single sector",
    "Multi sector",
    "Route distance",
    "Justifikasi",
  ])
    assert.doesNotMatch(ui, new RegExp(removed, "i"));
  for (const preserved of [
    "Identity",
    "Location",
    "Submission",
    "Coordinates",
    "Sectors & Cells",
    "SectorTable",
    "SectorCards",
    "Images",
    "People",
    "Recorded Timestamps",
    "Historical AOR Reports",
    "Data Quality",
    "TowerEditDialog",
    "TowerDependencyViewer",
    "TowerAuditTimeline",
    "View on Map",
  ])
    assert.match(ui, new RegExp(preserved));
  assert.match(repository, /ref\("tower"\)\.child\(towerKey\)/);
  assert.match(repository, /ref\("cell"\)\.orderByChild\("tower_id"\)/);
  assert.doesNotMatch(repository, /database\.ref[^;]+\.(?:set|update|push|transaction)\(/s);
});

test("routed Tower detail displays Site ID",()=>{assert.match(fs.readFileSync("src/components/tower-workspace/tower-operations-workspace.tsx","utf8"),/Site ID/)});
