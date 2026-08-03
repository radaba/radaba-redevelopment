import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createUpdateCellDetailsHandler } from "../../src/server/mobile-api/routes/update-cell-details.mjs";
import { createMobileCellCommandService } from "../../src/server/mobile-api/services/mobile-cell-command-service.mjs";
import {
  androidCellBase,
  antennaPortBody,
  cellUpdateBody,
  expectedMirroredCellUpdate,
} from "../fixtures/mobile-cell-command-fixtures.js";

const request = (body) => ({ json: async () => structuredClone(body) });

function setup(options = {}) {
  const operations = [];
  const records = structuredClone(options.records ?? []);
  let call = 0;
  let generated = 0;
  const check = () => {
    call += 1;
    if (options.failAt === call) throw new Error(`failure ${call}`);
  };
  const repository = {
    operations,
    records,
    async findCellsByRcellId(rcellId) {
      operations.push({ type: "read", path: "cell", query: ["rcell_id", rcellId] });
      check();
      return structuredClone(records.filter((row) => row.value.rcell_id === rcellId));
    },
    async updateCell(key, value) {
      operations.push({ type: "update", path: `cell/${key}`, value: structuredClone(value) });
      check();
      const row = records.find((candidate) => candidate.key === key);
      if (row) Object.assign(row.value, structuredClone(value));
    },
    async createCell(value) {
      operations.push({ type: "push", path: "cell", value: structuredClone(value) });
      check();
      generated += 1;
      records.push({ key: `generated-${generated}`, value: structuredClone(value) });
    },
  };
  return {
    repository,
    service: createMobileCellCommandService(repository),
  };
}

test("successful existing-sector update mirrors four legacy before fields", async () => {
  const { repository, service } = setup({
    records: [{ key: "cell-key", value: { rcell_id: cellUpdateBody.rcell_id } }],
  });
  assert.deepEqual(await service.update(cellUpdateBody), expectedMirroredCellUpdate);
  assert.deepEqual(repository.operations.map((operation) => operation.path), [
    "cell", "cell/cell-key",
  ]);
  assert.deepEqual(repository.records[0].value, expectedMirroredCellUpdate);
});

test("missing Cell creates one sector row under the Cell node", async () => {
  const { repository, service } = setup();
  assert.deepEqual(await service.update(antennaPortBody), antennaPortBody);
  assert.deepEqual(repository.operations.map((operation) => operation.type), ["read", "push"]);
  assert.equal(repository.records[0].value.rcell_id, antennaPortBody.rcell_id);
});

test("duplicate rcell_id updates every matching child in enumeration order", async () => {
  const records = [
    { key: "cell-a", value: { rcell_id: androidCellBase.rcell_id, old: "a" } },
    { key: "cell-b", value: { rcell_id: androidCellBase.rcell_id, old: "b" } },
  ];
  const { repository, service } = setup({ records });
  await service.update(antennaPortBody);
  assert.deepEqual(repository.operations.map((operation) => operation.path), [
    "cell", "cell/cell-a", "cell/cell-b",
  ]);
  assert.equal(repository.records.every((row) => row.value.antenna_port_quantity === "8"), true);
});

test("missing rcell_id preserves legacy unvalidated create behavior", async () => {
  const body = { assignment_id: "ASG-SAMPLE-011", sector: "2" };
  const { repository, service } = setup();
  assert.deepEqual(await service.update(body), body);
  assert.deepEqual(repository.operations[0].query, ["rcell_id", undefined]);
  assert.equal(Object.hasOwn(repository.records[0].value, "rcell_id"), false);
});

test("null and primitive payloads return the raw legacy 500 envelope", async () => {
  for (const body of [null, "invalid", 42, false]) {
    const response = await createUpdateCellDetailsHandler(setup().service)(request(body));
    assert.equal(response.status, 500);
    const envelope = await response.json();
    assert.equal(envelope.code, 500);
    assert.equal(envelope.message, "failed");
    assert.equal(typeof envelope.data, "string");
  }
});

test("malformed JSON returns the parser message in the legacy envelope", async () => {
  const response = await createUpdateCellDetailsHandler(setup().service)({
    json: async () => { throw new SyntaxError("Unexpected end of JSON input"); },
  });
  assert.deepEqual(await response.json(), {
    code: 500, message: "failed", data: "Unexpected end of JSON input",
  });
});

test("Cell query failure performs no write", async () => {
  const { repository, service } = setup({ failAt: 1 });
  const response = await createUpdateCellDetailsHandler(service)(request(cellUpdateBody));
  assert.equal(response.status, 500);
  assert.equal((await response.json()).data, "failure 1");
  assert.deepEqual(repository.operations.map((operation) => operation.type), ["read"]);
});

test("create failure returns 500 and leaves no Cell row", async () => {
  const { repository, service } = setup({ failAt: 2 });
  const response = await createUpdateCellDetailsHandler(service)(request(cellUpdateBody));
  assert.equal(response.status, 500);
  assert.equal(repository.records.length, 0);
});

test("duplicate update failure preserves earlier matching child mutation", async () => {
  const records = [
    { key: "cell-a", value: { rcell_id: androidCellBase.rcell_id } },
    { key: "cell-b", value: { rcell_id: androidCellBase.rcell_id } },
  ];
  const { repository, service } = setup({ records, failAt: 3 });
  const response = await createUpdateCellDetailsHandler(service)(request(antennaPortBody));
  assert.equal(response.status, 500);
  assert.equal(repository.records[0].value.antenna_port_quantity, "8");
  assert.equal(repository.records[1].value.antenna_port_quantity, undefined);
});

test("replay repeats the read and update without timestamps or markers", async () => {
  const { repository, service } = setup({
    records: [{ key: "cell-key", value: { rcell_id: androidCellBase.rcell_id } }],
  });
  await service.update(cellUpdateBody);
  await service.update(cellUpdateBody);
  assert.equal(repository.operations.filter((operation) => operation.type === "read").length, 2);
  assert.equal(repository.operations.filter((operation) => operation.type === "update").length, 2);
  assert.equal(Object.keys(repository.records[0].value).some((key) => /timestamp|updated|marker/i.test(key)), false);
});

test("retry after a failed create can create exactly one row", async () => {
  const { repository, service } = setup({ failAt: 2 });
  await assert.rejects(service.update(antennaPortBody), /failure 2/);
  await service.update(antennaPortBody);
  assert.equal(repository.records.length, 1);
});

test("zero, empty, null, false, and unknown values pass through", async () => {
  const body = {
    ...androidCellBase,
    mechanical_tilt_before: 0,
    antenna_port_note: "",
    antenna_type: null,
    active: false,
    unknown: "preserved",
  };
  const result = await setup().service.update(body);
  assert.equal(result.mechanical_tilt_after, 0);
  assert.equal(result.antenna_port_note, "");
  assert.equal(result.antenna_type, null);
  assert.equal(result.active, false);
  assert.equal(result.unknown, "preserved");
});

test("Android body variants and AssignmentCellResponse fields are compatible", async () => {
  for (const field of [
    "assignment_id", "tower_id", "rigger_email", "rcell_id", "band", "sector",
  ]) assert.equal(typeof androidCellBase[field], "string");
  const result = await setup().service.update({
    ...androidCellBase,
    rru_type: "Sample RRU",
    azimuth_before: "120",
    antenna_height: "42",
    antenna_port_in_use: "4",
    mechanical_tilt_before: "4",
    antenna_type: "Sample Antenna",
    antenna_port_quantity: "8",
    antenna_port_note: "",
  });
  for (const field of [
    "rru_type", "azimuth_after", "antenna_height", "antenna_port_in_use",
    "mechanical_tilt_before", "antenna_type", "mechanical_tilt_after",
    "azimuth_before", "antenna_port_quantity", "antenna_port_note",
  ]) assert.notEqual(result[field], undefined);
});

test("route preserves any-method fallthrough and one-node write boundary", () => {
  const route = fs.readFileSync(
    path.join(process.cwd(), "src/app/api/mobile/updateCellDetails/route.ts"),
    "utf8",
  );
  const repository = fs.readFileSync(
    path.join(process.cwd(), "src/server/mobile-api/repositories/firebase-mobile-cell-command-repository.ts"),
    "utf8",
  );
  for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]) {
    assert.match(route, new RegExp(`\\b${method}\\b`));
  }
  assert.match(repository, /MOBILE_RTDB_PATHS[.]cell/);
  assert.doesNotMatch(repository, /MOBILE_RTDB_PATHS[.](assignment|image|tower|user|achievement|log)/);
});

test("fixture contains no operational secrets or production URL", () => {
  const fixture = fs.readFileSync(
    path.join(process.cwd(), "tests/fixtures/mobile-cell-command-fixtures.js"),
    "utf8",
  );
  assert.match(fixture, /example[.]invalid/);
  assert.doesNotMatch(fixture, /PRIVATE KEY|AIza|Bearer|firebaseio[.]com|eyJ[A-Za-z0-9_-]{20,}[.]eyJ/i);
});
