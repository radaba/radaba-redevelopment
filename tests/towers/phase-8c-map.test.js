import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildTowerMapData, serializeTowerMapMarker, TOWER_MAP_MAX_RECORDS } from "../../src/features/tower/tower-map-contract.mjs";
import { towerMapFixtures } from "../fixtures/tower-map-fixtures.js";
const read=(path)=>fs.readFileSync(path,"utf8");

test("marker serializer accepts numeric and numeric-string coordinates with minimal fields",()=>{
  const numeric=serializeTowerMapMarker(towerMapFixtures[0]),strings=serializeTowerMapMarker(towerMapFixtures[1]);
  assert.equal(numeric.latitude,-6.2);assert.equal(strings.longitude,110.4);
  assert.deepEqual(Object.keys(numeric),["towerKey","towerId","siteId","siteName","latitude","longitude","region","subRegion","kabupaten","cluster","siteType","btsType","network"]);
  assert.equal("antenna_system" in numeric,false);assert.equal("additionalFields" in numeric,false);
});
test("invalid, out-of-range, and missing coordinates are excluded truthfully",()=>{
  assert.equal(serializeTowerMapMarker(towerMapFixtures[2]),null);
  assert.equal(serializeTowerMapMarker(towerMapFixtures[3]),null);
  assert.equal(serializeTowerMapMarker(towerMapFixtures[4]),null);
  const data=buildTowerMapData(towerMapFixtures);
  assert.equal(data.markers.length,2);assert.equal(data.excludedInvalidCoordinates,3);assert.equal(data.invalidCoordinates.length,3);assert.equal(data.scanned,5);
});
test("map contract has explicit 1000 maximum and bounded flag",()=>{
  assert.equal(TOWER_MAP_MAX_RECORDS,1000);
  const many=Array.from({length:1001},(_,index)=>({...towerMapFixtures[0],firebaseKey:`key-${index}`}));
  const data=buildTowerMapData(many);
  assert.equal(data.markers.length,1000);assert.equal(data.scanned,1000);assert.equal(data.boundedResult,true);
});
test("existing Tower repository uses a bounded server query with filters and no writes",()=>{
  const source=read("src/server/tower/firebase-tower-repository.ts");
  assert.match(source,/async map\(query/);assert.match(source,/orderByKey\(\)/);
  assert.match(source,/limitToFirst\(TOWER_MAP_MAX_RECORDS \+ 1\)/);
  assert.match(source,/filter\(\(\{ value \}\) => matches\(value, query\)\)/);
  const method=source.slice(source.indexOf("async map("),source.indexOf("async list("));
  assert.doesNotMatch(method,/\.set\(|\.update\(|\.remove\(/);
});
test("map page repeats Active exact Assignment authorization and uses no API",()=>{
  const page=read("src/app/home/towers/map/page.tsx");
  assert.match(page,/resolveAuthenticatedUser/);assert.match(page,/toLowerCase\(\)!==\"active\"/);
  assert.match(page,/canAccessAssignment/);assert.match(page,/FirebaseTowerReadRepository\(\)\.map/);
  assert.equal(fs.existsSync("src/app/api/towers/map"),false);
});
test("List and Map views preserve URL filters and expose accessible states",()=>{
  const list=read("src/components/tower/tower-directory.tsx"),page=read("src/components/tower/tower-map-page.tsx");
  assert.match(list,/Map View/);assert.match(list,/search\.entries\(\)/);
  for(const phrase of ["List View","Map View","Tower view switch","Tower map result summary","Valid coordinates","Invalid / missing","No Towers with valid coordinates","Map library could not load"])assert.match(page,new RegExp(phrase));
  assert.match(page,/min-h-\[28rem\]/);assert.match(page,/focus-visible:ring-2/);
});
test("MapLibre canvas clusters markers, fits bounds, resets view, and provides safe detail popups",()=>{
  const canvas=read("src/components/tower/tower-map-canvas.tsx");
  assert.match(canvas,/cluster:true/);assert.match(canvas,/clusterRadius:48/);
  assert.match(canvas,/fitBounds/);assert.match(canvas,/Reset View/);
  assert.match(canvas,/View Tower/);assert.match(canvas,/encodeURIComponent\(marker\.towerKey\)/);
  assert.match(canvas,/textContent=/);assert.doesNotMatch(canvas,/innerHTML|setHTML/);
  assert.match(canvas,/role=\"region\"/);assert.match(canvas,/privacy-safe-background/);
  assert.doesNotMatch(canvas,/https?:\/\//);
});
test("map canvas is dynamically imported without SSR and includes loading failure handling",()=>{
  const page=read("src/components/tower/tower-map-page.tsx");
  assert.match(page,/dynamic\(\(\)=>import\(\"\.\/tower-map-canvas\"\)/);
  assert.match(page,/ssr:false/);assert.match(page,/Loading Tower map/);
  assert.match(page,/onLoadFailure/);assert.match(page,/Privacy-safe basemap mode/);
});
