import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createGetAssignmentsByIdHandler } from "../../src/server/mobile-api/routes/get-assignments-by-id.mjs";
import { createGetImageDetailsHandler } from "../../src/server/mobile-api/routes/get-image-details.mjs";
import { createGetAorSummaryByIdHandler } from "../../src/server/mobile-api/routes/get-aor-summary-by-id.mjs";
import { createMobileAorSummaryService, createMobileAssignmentReadService, createMobileImageReadService } from "../../src/server/mobile-api/services/mobile-read-services.mjs";
import { createFakeMobileReadRepository } from "../../src/server/mobile-api/testing/fakes.mjs";
import { compareMobileCompatibility } from "../../src/server/mobile-api/testing/shadow-compare.mjs";
import { aorCellFixture, aorSummaryGolden, assignmentDetailGolden, imageDetailGolden, mobileAssignmentFixture, mobileImageFixture } from "../fixtures/mobile-assignment-image-fixtures.js";

const request = (id = "ASG-SAMPLE-002") => ({ nextUrl: new URL(`https://example.invalid/read${id === undefined ? "" : `?assignment_id=${id}`}`) });

test("assignment detail preserves the golden envelope and exact query", async () => {
  const repository = createFakeMobileReadRepository("assignment", { records: [mobileAssignmentFixture] });
  const response = await createGetAssignmentsByIdHandler(createMobileAssignmentReadService(repository))(request());
  assert.deepEqual(await response.json(), assignmentDetailGolden);
  assert.deepEqual(repository.operations, [{ type: "read", path: "assignment", orderBy: "assignment_id", equalTo: "ASG-SAMPLE-002" }]);
});

test("assignment detail selects first duplicate, returns empty, and leaves errors uncaught", async () => {
  const second = { ...mobileAssignmentFixture, sitename: "second" };
  const populated = createGetAssignmentsByIdHandler(createMobileAssignmentReadService(createFakeMobileReadRepository("assignment", { records: [mobileAssignmentFixture, second] })));
  assert.deepEqual((await (await populated(request())).json()).data, mobileAssignmentFixture);
  const empty = createGetAssignmentsByIdHandler(createMobileAssignmentReadService(createFakeMobileReadRepository("assignment")));
  assert.deepEqual((await (await empty(request())).json()).data, {});
  const error = new Error("assignment unavailable");
  const failing = createGetAssignmentsByIdHandler(createMobileAssignmentReadService(createFakeMobileReadRepository("assignment", { error })));
  await assert.rejects(failing(request()), error);
});

test("missing assignment query remains undefined", async () => {
  const repository = createFakeMobileReadRepository("assignment");
  await createGetAssignmentsByIdHandler(createMobileAssignmentReadService(repository))({ nextUrl: new URL("https://example.invalid/read") });
  assert.equal(repository.operations[0].equalTo, undefined);
});

test("image detail preserves FullTower values, first duplicate, and empty result", async () => {
  const second = { ...mobileImageFixture, tower_type: "duplicate" };
  const populated = createGetImageDetailsHandler(createMobileImageReadService(createFakeMobileReadRepository("image", { records: [mobileImageFixture, second] })));
  assert.deepEqual(await (await populated(request())).json(), imageDetailGolden);
  assert.equal(imageDetailGolden.data.image_status, null);
  assert.equal(typeof imageDetailGolden.data.total_antenna, "string");
  const empty = createGetImageDetailsHandler(createMobileImageReadService(createFakeMobileReadRepository("image")));
  assert.deepEqual((await (await empty(request())).json()).data, {});
});

test("image detail converts errors to legacy raw 500 envelope", async () => {
  const handler = createGetImageDetailsHandler(createMobileImageReadService(createFakeMobileReadRepository("image", { error: new Error("image unavailable") })));
  const response = await handler(request());
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { code: 500, message: "failed", data: "image unavailable" });
});

test("AOR summary reads sequentially and matches golden composite", async () => {
  const events = [];
  const tracked = (name, records) => ({ async findByAssignmentId() { events.push(name); return structuredClone(records); } });
  const service = createMobileAorSummaryService({ assignments: tracked("assignment", [mobileAssignmentFixture]), cells: tracked("cell", [aorCellFixture]), images: tracked("image", [mobileImageFixture]) });
  const response = await createGetAorSummaryByIdHandler(service)(request());
  assert.deepEqual(await response.json(), aorSummaryGolden);
  assert.deepEqual(events, ["assignment", "cell", "image"]);
  assert.equal(aorCellFixture.tower_height, "40");
});

for (const absent of ["assignment", "cell", "image"]) {
  test(`AOR summary returns empty when ${absent} is absent`, async () => {
    const service = createMobileAorSummaryService({
      assignments: createFakeMobileReadRepository("assignment", { records: absent === "assignment" ? [] : [mobileAssignmentFixture] }),
      cells: createFakeMobileReadRepository("cell", { records: absent === "cell" ? [] : [aorCellFixture] }),
      images: createFakeMobileReadRepository("image", { records: absent === "image" ? [] : [mobileImageFixture] }),
    });
    assert.deepEqual(await service.findByAssignmentId("ASG-SAMPLE-002"), {});
  });
}

test("AOR errors stay uncaught and stop later reads", async () => {
  const images = createFakeMobileReadRepository("image", { records: [mobileImageFixture] });
  const service = createMobileAorSummaryService({ assignments: createFakeMobileReadRepository("assignment", { records: [mobileAssignmentFixture] }), cells: createFakeMobileReadRepository("cell", { error: new Error("cell unavailable") }), images });
  await assert.rejects(service.findByAssignmentId("ASG-SAMPLE-002"), /cell unavailable/);
  assert.equal(images.operations.length, 0);
});

for (const route of ["getassignmentsById", "getImageDetails", "getAorSummaryById"]) {
  test(`${route} preserves any-method fallthrough without auth or writes`, () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src", "app", "api", "mobile", route, "route.ts"), "utf8");
    for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]) assert.match(source, new RegExp(`\\b${method}\\b`));
    assert.doesNotMatch(source, /verifyIdToken|authorization|[.]set[(]|[.]update[(]|[.]push[(]|[.]remove[(]/i);
  });
}

test("repositories use exact equality reads and no writes", () => {
  for (const file of ["firebase-mobile-assignment-repository.ts", "firebase-mobile-image-repository.ts"]) {
    const source = fs.readFileSync(path.join(process.cwd(), "src/server/mobile-api/repositories", file), "utf8");
    assert.match(source, /orderByChild\("assignment_id"\)[\s\S]*[.]equalTo\(assignmentId[\s\S]*[.]once\("value"\)/);
    assert.doesNotMatch(source, /[.]set[(]|[.]update[(]|[.]remove[(]/);
  }
});

test("fixtures are sanitized and golden shadows match", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "tests/fixtures/mobile-assignment-image-fixtures.js"), "utf8");
  assert.doesNotMatch(source, /PRIVATE KEY|AIza[0-9A-Za-z_-]{20,}|password\s*[:=]/i);
  assert.match(source, /example\.invalid/);
  for (const fixture of [assignmentDetailGolden, imageDetailGolden, aorSummaryGolden]) assert.equal(compareMobileCompatibility(fixture, structuredClone(fixture)).equal, true);
});
