import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  createMobileImageCommandService,
  fullTowerSnapshotValues,
} from "../../src/server/mobile-api/services/mobile-image-command-service.mjs";
import { createUpdateImageDetailsHandler } from "../../src/server/mobile-api/routes/update-image-details.mjs";
import { imageWriteBody, imageAssignment } from "../fixtures/mobile-image-write-fixtures.js";
function fake(options = {}) {
  const operations = [];
  let call = 0;
  const hit = () => {
    call++;
    if (options.failAt === call) throw new Error(`failure ${call}`);
  };
  return {
    operations,
    async findAssignments(id) {
      operations.push({ type: "read", path: "assignment", orderBy: "assignment_id", equalTo: id });
      hit();
      return options.assignments ?? [{ key: "a1", value: imageAssignment }];
    },
    async upsertCell(id, value) {
      operations.push({ type: "cell-upsert", path: "cell", id, value: structuredClone(value) });
      hit();
    },
    async upsertImage(id, value, sync) {
      operations.push({
        type: "image-upsert",
        path: "image",
        id,
        value: structuredClone(value),
        sync: structuredClone(sync),
      });
      hit();
    },
  };
}
const request = (body = imageWriteBody) => ({ json: async () => structuredClone(body) });
test("image write preserves body and exact Assignment-cell-image order", async () => {
  const r = fake();
  const result = await createMobileImageCommandService(r).update(structuredClone(imageWriteBody));
  assert.deepEqual(result, imageWriteBody);
  assert.deepEqual(
    r.operations.map((x) => `${x.type}:${x.path}`),
    ["read:assignment", "cell-upsert:cell", "cell-upsert:cell", "image-upsert:image"],
  );
  assert.equal(r.operations[1].id, "sector_1_g900_ASG-SAMPLE-004");
  assert.equal(r.operations[2].id, "sector_2_g900_ASG-SAMPLE-004");
  assert.deepEqual(r.operations[1].value, {
    tower_height: "40",
    rcell_id: "sector_1_g900_ASG-SAMPLE-004",
  });
});
test("absent tower_height skips Cell fan-out but still upserts image", async () => {
  const r = fake({ assignments: [] });
  const body = { assignment_id: "ASG-SAMPLE-004", url: "" };
  await createMobileImageCommandService(r).update(body);
  assert.deepEqual(
    r.operations.map((x) => x.path),
    ["assignment", "image"],
  );
});
test("tower_height with missing Assignment preserves legacy failure before image write", async () => {
  const r = fake({ assignments: [] });
  await assert.rejects(createMobileImageCommandService(r).update(structuredClone(imageWriteBody)));
  assert.deepEqual(
    r.operations.map((x) => x.path),
    ["assignment"],
  );
});
test("partial Cell failure stops later fan-out and image write", async () => {
  const r = fake({ failAt: 3 });
  await assert.rejects(
    createMobileImageCommandService(r).update(structuredClone(imageWriteBody)),
    /failure 3/,
  );
  assert.deepEqual(
    r.operations.map((x) => x.path),
    ["assignment", "cell", "cell"],
  );
});
test("image failure returns raw legacy 500 after completed Cell fan-out", async () => {
  const r = fake({ failAt: 4 });
  const response = await createUpdateImageDetailsHandler(createMobileImageCommandService(r))(
    request(),
  );
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { code: 500, message: "failed", data: "failure 4" });
  assert.equal(r.operations.filter((x) => x.path === "cell").length, 2);
});
test("replay repeats every upsert and adds no idempotency marker", async () => {
  const r = fake();
  const s = createMobileImageCommandService(r);
  await s.update(structuredClone(imageWriteBody));
  await s.update(structuredClone(imageWriteBody));
  assert.equal(r.operations.length, 8);
  assert.equal(r.operations.filter((x) => x.path === "image").length, 2);
});
test("mixed values and unknown fields remain unchanged", async () => {
  const r = fake();
  const response = await createUpdateImageDetailsHandler(createMobileImageCommandService(r))(
    request(),
  );
  assert.deepEqual((await response.json()).data, imageWriteBody);
  assert.equal(imageWriteBody.image_status, null);
  assert.equal(imageWriteBody.uploaded, false);
  assert.equal(imageWriteBody.count, 0);
});
test("Full Tower snapshot preserves source types and excludes blank, missing, and unresolved values", () => {
  assert.deepEqual(
    fullTowerSnapshotValues({
      tower_height: "40",
      total_antenna: "0",
      total_rru: 0,
      single_sector: "Yes",
      multi_sector: " ",
      route_distance: undefined,
      justifikasi: "unverified",
      unknown: "x",
    }),
    {
      tower_height: "40",
      total_antenna: "0",
      total_rru: 0,
      single_sector: "Yes",
      justifikasi: "unverified",
    },
  );
});
test("active image update requests exact Assignment snapshot synchronization", async () => {
  const r = fake({
    assignments: [
      { key: "push-a", value: { ...imageAssignment, assignment_state: "On Progress" } },
    ],
  });
  const body = {
    assignment_id: imageAssignment.assignment_id,
    tower_type: "SST",
    tower_height: "40",
    total_rru: 0,
    route_distance: "0",
    justifikasi: "excluded",
  };
  await createMobileImageCommandService(r).update(body);
  const operation = r.operations.at(-1);
  assert.equal(operation.sync.assignmentKey, "push-a");
  assert.equal(operation.sync.synchronizeAssignment, true);
  assert.deepEqual(operation.sync.snapshot, {
    tower_type: "SST",
    tower_height: "40",
    total_rru: 0,
    route_distance: "0",
    justifikasi: "excluded",
  });
  assert.equal(r.operations[0].equalTo, imageAssignment.assignment_id);
});
test("historical image update remains Android-compatible but does not synchronize Assignment", async () => {
  const r = fake({
    assignments: [{ key: "push-a", value: { ...imageAssignment, assignment_state: "Finished" } }],
  });
  const body = { assignment_id: imageAssignment.assignment_id, total_rru: "3" };
  assert.deepEqual(await createMobileImageCommandService(r).update(body), body);
  assert.equal(r.operations.at(-1).sync.synchronizeAssignment, false);
});
test("route casing and any-method fallthrough are exact", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), "src/app/api/mobile/updateImageDetails/route.ts"),
    "utf8",
  );
  for (const m of ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"])
    assert.match(source, new RegExp(`\\b${m}\\b`));
  assert.doesNotMatch(source, /Storage|verifyIdToken|assignment_state|achievement|metrics/i);
});
test("repository atomically updates exact image matches, Assignment snapshot, and bounded audit", () => {
  const source = fs.readFileSync(
    path.join(
      process.cwd(),
      "src/server/mobile-api/repositories/firebase-mobile-image-command-repository.ts",
    ),
    "utf8",
  );
  assert.match(source, /database\.ref\(\)\.transaction/);
  assert.match(source, /assignment_id\s*===\s*assignmentId/);
  assert.match(source, /assignment_audit/);
  assert.match(source, /full_tower_snapshot_synchronization/);
  assert.match(source, /source_image_keys/);
  assert.match(
    source,
    /root\.assignment\[sync\.assignmentKey\]\s*=\s*\{\s*\.\.\.assignment,\s*\.\.\.after\s*\}/,
  );
  assert.doesNotMatch(source, /count.*cell|root\.cell/i);
});
test("fixture contains no secrets or operational URLs", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), "tests/fixtures/mobile-image-write-fixtures.js"),
    "utf8",
  );
  assert.match(source, /example[.]invalid/);
  assert.doesNotMatch(
    source,
    /PRIVATE KEY|eyJ[A-Za-z0-9_-]{20,}[.]eyJ|AIza|Bearer|X-Goog-Signature|firebaseapp[.]com/i,
  );
});
