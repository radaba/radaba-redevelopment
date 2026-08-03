import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { mapTower, towerCoordinates } from "../../src/features/tower/tower-mapper.mjs";
import { parseTowerQuery, TOWER_SCAN_LIMIT } from "../../src/features/tower/tower-query-contract.mjs";
import { completeTower, sparseTower } from "../fixtures/tower-fixtures.js";
const read = (path) => fs.readFileSync(path, "utf8");

test("mapper preserves complete fields, radio scalars, and separates Firebase key", () => {
  const tower = mapTower("-push-key", completeTower);
  assert.equal(tower.firebaseKey, "-push-key");
  assert.equal(tower.tower_id, "TWR-001");
  assert.equal(tower.site_id, "Site-Abc-01");
  assert.equal(tower.g1800, 2);
  assert.equal(tower.additionalFields.enodeb_id, "10001");
  assert.equal("key" in tower.additionalFields, false);
});
test("mapper safely maps sparse values without inventing operational values", () => {
  const tower = mapTower("key", sparseTower);
  assert.equal(tower.site_id, null);
  assert.equal(tower.sitename, null);
  assert.equal(tower.u2100, null);
  assert.deepEqual(towerCoordinates(tower), { latitude: -6.1, longitude: 106.7 });
});
test("legacy records without Site ID load and hide legacy Tower status metadata", () => {
  const tower = mapTower("legacy", { tower_id: "OLD-1", radaba_status: "Yes" });
  assert.equal(tower.site_id, null);
  assert.equal("radaba_status" in tower.additionalFields, false);
});
test("coordinates accept numeric variants and reject invalid ranges", () => {
  assert.deepEqual(towerCoordinates(mapTower("key", completeTower)), { latitude: -6.2, longitude: 106.8 });
  assert.equal(towerCoordinates(mapTower("key", { latitude: 99, longitude: 106 })), null);
  assert.equal(towerCoordinates(mapTower("key", { latitude: "x", longitude: 106 })), null);
});
test("query contract defaults, validates allowed sizes, filters, and cursor", () => {
  assert.deepEqual(parseTowerQuery({}), { q:"",region:"",subRegion:"",province:"",kabupaten:"",cluster:"",siteType:"",btsType:"",pageSize:25,cursor:null });
  assert.equal(parseTowerQuery({ q:" twr ", region:" east ", pageSize:"100", cursor:"-abc_123" }).q, "twr");
  assert.throws(() => parseTowerQuery({ pageSize:"500" }));
  assert.throws(() => parseTowerQuery({ cursor:"bad/cursor" }));
});
test("repository is read-only, bounded, stable, and prioritizes exact Tower ID", () => {
  const source = read("src/server/tower/firebase-tower-repository.ts");
  assert.match(source, /orderByChild\("tower_id"\)\.equalTo/);
  assert.match(source, /"site_id"/);
  assert.match(source, /orderByKey\(\)/);
  assert.match(source, /limitToFirst\(TOWER_SCAN_LIMIT/);
  assert.equal(TOWER_SCAN_LIMIT, 500);
  assert.doesNotMatch(source, /\.set\(|\.update\(|\.remove\(/);
});
test("routes independently authorize reads and restrict writes to administrators", () => {
  const list = read("src/app/api/towers/route.ts");
  const detail = read("src/app/api/towers/[towerKey]/route.ts");
  assert.match(list, /resolveTowerActor/);
  assert.match(detail, /resolveTowerActor/);
  assert.match(list, /export async function POST/);
  assert.match(list, /resolveAdministrator/);
  assert.match(detail, /export async function PATCH/);
  assert.match(detail, /resolveAdministrator/);
  assert.doesNotMatch(list + detail, /export async function (PUT|DELETE)/);
  assert.match(detail, /status: 404/);
  assert.match(list + detail, /private, no-store/);
});
test("UI includes navigation, desktop table, mobile cards, filters, states and detail sections", () => {
  const nav = read("src/components/application-shell/navigation-config.ts");
  const list = read("src/components/tower/tower-directory.tsx");
  const detail = read("src/components/tower/tower-detail.tsx");
  assert.match(nav, /href: "\/home\/towers"/);
  assert.match(nav, /assignmentOnly: true/);
  for (const text of ["Tower ID","Site ID","Site Name","View Details","Apply Filters","Clear Filters","Tower pagination","No matching Towers"]) assert.match(list, new RegExp(text));
  assert.doesNotMatch(list + detail, /radaba_status|Operational Status/);
  for (const text of ["General Information","Administrative Location","Coordinates","Radio Configuration","Assignment Compatibility Information","Record Metadata"]) assert.match(detail, new RegExp(text));
});
test("authorization derives Towers access from active exact Assignment privilege", () => {
  const session = read("src/server/tower/tower-session.ts");
  const layout = read("src/app/home/layout.tsx");
  assert.match(session, /resolveAssignmentActor as resolveTowerActor/);
  assert.match(layout, /canAccessAssignment/);
  assert.match(layout, /toLowerCase\(\) === "active"/);
});
