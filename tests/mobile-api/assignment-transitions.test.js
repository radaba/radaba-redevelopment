import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createUpdateAssignmentDetailsHandler } from "../../src/server/mobile-api/routes/update-assignment-details.mjs";
import { createMobileAssignmentTransitionService } from "../../src/server/mobile-api/services/mobile-assignment-transition-service.mjs";
import {
  androidTransitionBodies,
  fixedTransitionTime,
  transitionAssignment,
} from "../fixtures/mobile-assignment-transition-fixtures.js";

const clock = { current: () => structuredClone(fixedTransitionTime) };
const request = (body) => ({ json: async () => structuredClone(body) });
function setup(options = {}) {
  const operations = [];
  let call = 0;
  const records = structuredClone(
    options.assignments ?? [{ key: "assignment-key", value: transitionAssignment }],
  );
  const fail = () => {
    call += 1;
    if (options.failAt === call) throw new Error(`failure ${call}`);
  };
  const repository = {
    operations,
    records,
    async findAssignments(id) {
      operations.push({ type: "read", path: "assignment", equalTo: id });
      fail();
      return structuredClone(records);
    },
    async findUsersByEmail(email) {
      operations.push({ type: "read", path: "user", equalTo: email });
      fail();
      return [{ key: "user-key", value: { email } }];
    },
    async updateAssignment(key, update) {
      operations.push({
        type: "update",
        path: `assignment/${key}`,
        value: structuredClone(update),
      });
      fail();
      const record = records.find((candidate) => candidate.key === key);
      if (record) Object.assign(record.value, structuredClone(update));
    },
  };
  return {
    repository,
    service: createMobileAssignmentTransitionService(repository, clock),
  };
}

test("pause preserves exact legacy fields and operation order", async () => {
  const { repository, service } = setup();
  assert.deepEqual(await service.transition(androidTransitionBodies.pause), {
    paused_datetime: "2026-07-27 13:14:15",
    paused_date: "2026-07-27",
    assignment_state: "Paused",
    rigger_email_assignment_status_tower_id:
      "rigger@example.invalid_Open_TOWER-SAMPLE-009",
    rigger_email_assignment_status_assignment_id:
      "rigger@example.invalid_Open_NPMXL_TOWER-SAMPLE-009_072726_1785158055",
    index_created_date_assignment_state: "Paused_2026-07-20",
  });
  assert.deepEqual(repository.operations.map((entry) => entry.path), [
    "assignment", "user", "assignment/assignment-key",
  ]);
});

test("reject preserves reason, close fields, and Android DTO fields", async () => {
  const update = await setup().service.transition(androidTransitionBodies.reject);
  assert.equal(update.reason, "Other");
  assert.equal(update.assignment_state, "Rejected");
  assert.equal(update.assignment_status, "Closed");
  assert.equal(update.closed_date, "2026-07-27");
  assert.equal(update.closed_datetime, "2026-07-27 13:14:15");
  assert.equal(update.index_created_date_assignment_status, "Closed_2026-07-20");
});

test("drop preserves closed and site timestamps", async () => {
  const update = await setup().service.transition(androidTransitionBodies.drop);
  assert.equal(update.reason, "Sick");
  assert.equal(update.assignment_state, "Dropped");
  assert.equal(update.assignment_status, "Closed");
  assert.equal(update.site_date, update.closed_date);
  assert.equal(update.site_datetime, update.closed_datetime);
});

test("On Progress is the resume-like transition and adds no timestamp", async () => {
  const update = await setup().service.transition(androidTransitionBodies.resume);
  assert.deepEqual(Object.keys(update).sort(), [
    "assignment_state",
    "index_created_date_assignment_state",
    "rigger_email_assignment_status_assignment_id",
    "rigger_email_assignment_status_tower_id",
  ]);
});

test("missing Assignment returns the legacy success string without later reads", async () => {
  const { repository, service } = setup({ assignments: [] });
  const response = await createUpdateAssignmentDetailsHandler(service)(
    request(androidTransitionBodies.pause),
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    code: 200, message: "success", data: "The assignment not found",
  });
  assert.deepEqual(repository.operations.map((entry) => entry.path), ["assignment"]);
});

test("invalid body and excluded states are rejected before Firebase access", async () => {
  for (const body of [
    null, {}, { assignment_state: "Finished" }, { assignment_state: "Accepted" },
  ]) {
    const { repository, service } = setup();
    const response = await createUpdateAssignmentDetailsHandler(service)(request(body));
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      code: 400, message: "failed", data: "The assignment state not supported",
    });
    assert.equal(repository.operations.length, 0);
  }
});

test("invalid JSON preserves the legacy 500 envelope", async () => {
  const response = await createUpdateAssignmentDetailsHandler(setup().service)({
    json: async () => { throw new SyntaxError("Unexpected end of JSON input"); },
  });
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), {
    code: 500, message: "failed", data: "Unexpected end of JSON input",
  });
});

test("read failure stops later work and preserves the 500 envelope", async () => {
  for (const failAt of [1, 2]) {
    const { repository, service } = setup({ failAt });
    const response = await createUpdateAssignmentDetailsHandler(service)(
      request(androidTransitionBodies.pause),
    );
    assert.equal(response.status, 500);
    assert.equal((await response.json()).data, `failure ${failAt}`);
    assert.equal(repository.operations.length, failAt);
  }
});

test("single write failure leaves prior Assignment state intact", async () => {
  const { repository, service } = setup({ failAt: 3 });
  const response = await createUpdateAssignmentDetailsHandler(service)(
    request(androidTransitionBodies.drop),
  );
  assert.equal(response.status, 500);
  assert.equal(repository.records[0].value.assignment_state, "Accepted");
});

test("duplicate lifecycle requests replay the one Assignment update", async () => {
  for (const body of Object.values(androidTransitionBodies)) {
    const { repository, service } = setup();
    await service.transition(body);
    await service.transition(body);
    assert.equal(repository.operations.filter((entry) => entry.type === "update").length, 2);
    assert.equal(repository.operations.length, 6);
  }
});

test("resume after a failed write succeeds without partial state", async () => {
  const { repository, service } = setup({ failAt: 3 });
  await assert.rejects(service.transition(androidTransitionBodies.resume), /failure 3/);
  await service.transition(androidTransitionBodies.resume);
  assert.equal(repository.records[0].value.assignment_state, "On Progress");
});

test("route retains any-method fallthrough and excludes forbidden fan-out", () => {
  const route = fs.readFileSync(
    path.join(process.cwd(), "src/app/api/mobile/updateAssignmentDetails/route.ts"),
    "utf8",
  );
  const repository = fs.readFileSync(
    path.join(
      process.cwd(),
      "src/server/mobile-api/repositories/firebase-mobile-assignment-command-repository.ts",
    ),
    "utf8",
  );
  for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]) {
    assert.match(route, new RegExp(`\\b${method}\\b`));
  }
  assert.doesNotMatch(
    `${route}\n${repository}`,
    /MOBILE_RTDB_PATHS[.](cell|image|tower|achievement)|metrics|storage/i,
  );
});

test("Android request and response DTO fields remain compatible", async () => {
  for (const body of Object.values(androidTransitionBodies)) {
    assert.deepEqual(Object.keys(body).filter((key) => key !== "reason"), [
      "assignment_state", "assignment_id", "tower_id", "rigger_email",
    ]);
    const result = await setup().service.transition(body);
    assert.equal(typeof result.assignment_state, "string");
    for (const field of [
      "reason", "closed_date", "assignment_status", "closed_datetime",
    ]) {
      if (Object.hasOwn(result, field)) assert.notEqual(result[field], undefined);
    }
  }
});

