import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createGetCellDetailsPerSectorHandler } from "../../src/server/mobile-api/routes/get-cell-details-per-sector.mjs";
import { createGetUtilityHandler } from "../../src/server/mobile-api/routes/get-utility.mjs";
import { createMobileSectorReadService, createMobileUtilityReadService } from "../../src/server/mobile-api/services/mobile-cell-support-services.mjs";
import { createFakeMobileSectorRepository, createFakeMobileUtilityRepository } from "../../src/server/mobile-api/testing/fakes.mjs";
import { compareMobileCompatibility } from "../../src/server/mobile-api/testing/shadow-compare.mjs";
import { sectorCellFixture, sectorGolden, utilityFixture, utilityGolden } from "../fixtures/mobile-cell-support-fixtures.js";

const request = (query = "") => ({ nextUrl: new URL(`https://example.invalid/read${query}`) });

test("sector detail preserves the Cell DTO golden shape and exact query", async () => {
  const repository = createFakeMobileSectorRepository({ records: [sectorCellFixture] });
  const handler = createGetCellDetailsPerSectorHandler(createMobileSectorReadService(repository));
  assert.deepEqual(await (await handler(request("?rcell_id=sector_2_l1800_ASG-SAMPLE-003"))).json(), sectorGolden);
  assert.deepEqual(repository.operations, [{ type: "read", path: "cell", orderBy: "rcell_id", equalTo: "sector_2_l1800_ASG-SAMPLE-003" }]);
  assert.equal(sectorGolden.data[0].azimuth_before, 0);
  assert.equal(sectorGolden.data[0].azimuth_after, "");
  assert.equal(sectorGolden.data[0].antenna_port_note, null);
});

test("sector detail preserves duplicates, empty results, and missing input", async () => {
  const duplicate = { ...sectorCellFixture, sitename: "duplicate" };
  const repository = createFakeMobileSectorRepository({ records: [sectorCellFixture, duplicate] });
  const handler = createGetCellDetailsPerSectorHandler(createMobileSectorReadService(repository));
  assert.equal((await (await handler(request("?rcell_id=x"))).json()).data.length, 2);
  const empty = createGetCellDetailsPerSectorHandler(createMobileSectorReadService(createFakeMobileSectorRepository()));
  assert.deepEqual((await (await empty(request("?rcell_id=missing"))).json()).data, []);
  const missing = createFakeMobileSectorRepository();
  await createGetCellDetailsPerSectorHandler(createMobileSectorReadService(missing))(request());
  assert.equal(missing.operations[0].equalTo, undefined);
});

test("sector detail uses first repeated query value and exposes raw read errors", async () => {
  const repeated = createFakeMobileSectorRepository();
  await createGetCellDetailsPerSectorHandler(createMobileSectorReadService(repeated))(request("?rcell_id=first&rcell_id=second"));
  assert.equal(repeated.operations[0].equalTo, "first");
  const failing = createGetCellDetailsPerSectorHandler(createMobileSectorReadService(createFakeMobileSectorRepository({ error: new Error("sector unavailable") })));
  const response = await failing(request("?rcell_id=x"));
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { code: 500, message: "failed", data: "sector unavailable" });
});

test("utility preserves Android-consumed fields and exact orderByKey read", async () => {
  const repository = createFakeMobileUtilityRepository({ records: [utilityFixture] });
  const handler = createGetUtilityHandler(createMobileUtilityReadService(repository));
  assert.deepEqual(await (await handler(request())).json(), utilityGolden);
  assert.deepEqual(repository.operations, [{ type: "read", path: "utility", orderBy: "$key" }]);
  assert.equal(utilityGolden.data[0].distance, 0);
  assert.equal(utilityGolden.data[0].force_update, false);
  assert.equal(utilityGolden.data[0].geolocation, "");
});

test("utility returns not found for an empty node and first key-ordered child for duplicates", async () => {
  const empty = createGetUtilityHandler(createMobileUtilityReadService(createFakeMobileUtilityRepository()));
  assert.equal((await (await empty(request())).json()).data, "not found");
  const second = { ...utilityFixture, app_version: 99 };
  const populated = createGetUtilityHandler(createMobileUtilityReadService(createFakeMobileUtilityRepository({ records: [utilityFixture, second] })));
  assert.deepEqual((await (await populated(request())).json()).data, [utilityFixture]);
});

test("utility preserves raw Firebase error envelope", async () => {
  const handler = createGetUtilityHandler(createMobileUtilityReadService(createFakeMobileUtilityRepository({ error: new Error("utility unavailable") })));
  const response = await handler(request());
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { code: 500, message: "failed", data: "utility unavailable" });
});

for (const route of ["getCellDetailsPerSector", "getUtility"]) {
  test(`${route} preserves legacy any-method fallthrough and has no auth or writes`, () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src/app/api/mobile", route, "route.ts"), "utf8");
    for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]) assert.match(source, new RegExp(`\\b${method}\\b`));
    assert.doesNotMatch(source, /verifyIdToken|authorization|[.]set[(]|[.]update[(]|[.]push[(]|[.]remove[(]|transaction|onDisconnect/i);
  });
}

test("M6R repositories preserve exact paths/queries and contain no database writes", () => {
  const cell = fs.readFileSync(path.join(process.cwd(), "src/server/mobile-api/repositories/firebase-mobile-cell-repository.ts"), "utf8");
  const utility = fs.readFileSync(path.join(process.cwd(), "src/server/mobile-api/repositories/firebase-mobile-utility-repository.ts"), "utf8");
  assert.match(cell, /ref\(MOBILE_RTDB_PATHS[.]cell\)[\s\S]*orderByChild\("rcell_id"\)[\s\S]*equalTo\(rcellId/);
  assert.match(utility, /ref\(MOBILE_RTDB_PATHS[.]utility\)[\s\S]*orderByKey\(\)[\s\S]*once\("value"\)/);
  for (const source of [cell, utility]) assert.doesNotMatch(source, /[.]set[(]|[.]update[(]|[.]remove[(]|transaction[(]|onDisconnect/);
});

test("M6R fixtures are sanitized and golden shadows match", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "tests/fixtures/mobile-cell-support-fixtures.js"), "utf8");
  assert.doesNotMatch(source, /PRIVATE KEY|eyJ[A-Za-z0-9_-]{20,}[.]eyJ|AIza[0-9A-Za-z_-]{20,}|Bearer\s+|password\s*[:=]|@(gmail|yahoo|hotmail)[.]/i);
  assert.match(source, /example[.]invalid/);
  for (const body of [sectorGolden, utilityGolden]) assert.equal(compareMobileCompatibility({ status: 200, body }, { status: 200, body: structuredClone(body) }).equal, true);
});
