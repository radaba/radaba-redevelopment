import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createUpdateAssignmentDetailsHandler } from "../../src/server/mobile-api/routes/update-assignment-details.mjs";
import { createMobileAssignmentFinishService } from "../../src/server/mobile-api/services/mobile-assignment-finish-service.mjs";
import { createMobileAssignmentTransitionService } from "../../src/server/mobile-api/services/mobile-assignment-transition-service.mjs";
import {
  finishAssignment,
  finishBody,
  finishTime,
  finishUser,
} from "../fixtures/mobile-assignment-finish-fixtures.js";

const clock = { current: () => structuredClone(finishTime) };
const request = (body = finishBody) => ({ json: async () => structuredClone(body) });

function setup(options = {}) {
  const operations = [];
  const state = new Map();
  let call = 0;
  let key = 0;
  const record = (operation) => {
    operations.push(structuredClone(operation));
    call += 1;
    if (options.failAt === call || options.failPath === operation.path) {
      throw new Error(`failure ${call} ${operation.path}`);
    }
  };
  const repository = {
    operations,
    state,
    async findAssignments(id) {
      record({ type: "read", path: "assignment", query: ["assignment_id", id] });
      return structuredClone(options.assignments ??
        [{ key: "assignment-key", value: finishAssignment }]);
    },
    async findUsersByEmail(email) {
      record({ type: "read", path: "user", query: ["email", email] });
      return structuredClone(options.users ??
        [{ key: "user-key", value: finishUser }]);
    },
    async upsertCell(rcellId, value) {
      record({ type: "upsert", path: `cell/${rcellId}`, value });
      state.set(`cell/${rcellId}`, structuredClone(value));
    },
    async updateImages(id, value) {
      record({ type: "update-query", path: "image", query: ["assignment_id", id], value });
      state.set(`image/${id}`, structuredClone(value));
    },
    async updateTower(id, value) {
      record({ type: "update-query", path: "tower", query: ["tower_id", id], value });
      state.set(`tower/${id}`, structuredClone(value));
    },
    async updateUsersByEmail(email, value) {
      record({ type: "update-query", path: "user", query: ["email", email], value });
      state.set(`user/${email}`, structuredClone(value));
    },
    async updateAssignment(id, value) {
      record({ type: "update", path: `assignment/${id}`, value });
      state.set(`assignment/${id}`, structuredClone(value));
    },
    async findProductivityRow(basePath, index) {
      record({ type: "read", path: basePath, query: ["index_closed_date_stakeholder", index] });
      const stored = state.get(`${basePath}|${index}`);
      return stored ? { key: stored.key, value: structuredClone(stored.value) } : undefined;
    },
    async findRiggerAchievement(basePath, index) {
      record({ type: "read", path: basePath, query: ["index", index] });
      const stored = state.get(`${basePath}|${index}`);
      return stored ? { key: stored.key, value: structuredClone(stored.value) } : undefined;
    },
    createPushKey(basePath) {
      key += 1;
      const value = `generated-${key}`;
      operations.push({ type: "push-key", path: basePath, key: value });
      return value;
    },
    async transactionProductivity(target, mapper) {
      record({ type: "transaction", path: target });
      const current = state.get(target);
      const next = mapper(structuredClone(current));
      state.set(target, next);
      const split = target.lastIndexOf("/");
      const base = target.slice(0, split);
      state.set(`${base}|${next.index_closed_date_stakeholder}`, {
        key: target.slice(split + 1), value: structuredClone(next),
      });
    },
    async transactionRiggerAchievement(target, mapper) {
      record({ type: "transaction", path: target });
      const current = state.get(target);
      const next = mapper(structuredClone(current));
      state.set(target, next);
      const split = target.lastIndexOf("/");
      const base = target.slice(0, split);
      state.set(`${base}|${next.index}`, {
        key: target.slice(split + 1), value: structuredClone(next),
      });
    },
    timestamp() {
      return finishTime.currDatetime;
    },
  };
  return {
    repository,
    service: createMobileAssignmentFinishService(repository, clock),
  };
}

function handler(finishService) {
  const transitionRepository = {
    findAssignments: async () => [],
    findUsersByEmail: async () => [],
    updateAssignment: async () => {},
  };
  return createUpdateAssignmentDetailsHandler(
    createMobileAssignmentTransitionService(transitionRepository, clock),
    finishService,
  );
}

test("Finished preserves exact pre-fan-out order and Assignment response fields", async () => {
  const { repository, service } = setup();
  const response = await handler(service)(request());
  assert.equal(response.status, 200);
  const envelope = await response.json();
  assert.equal(envelope.code, 200);
  assert.equal(envelope.message, "success");
  assert.deepEqual(repository.operations.slice(0, 7).map((item) => item.path), [
    "assignment",
    "user",
    "cell/sector_1_g900_ASG-SAMPLE-010",
    "image",
    "tower",
    "user",
    "assignment/assignment-key",
  ]);
  assert.equal(envelope.data.assignment_state, "Finished");
  assert.equal(envelope.data.assignment_status, "Closed");
  assert.equal(envelope.data.closed_date, "2026-07-27");
  assert.equal(envelope.data.closed_datetime, "2026-07-27 13:14:15");
  assert.equal(envelope.data.image_status, "");
  assert.equal(envelope.data.completed, false);
  assert.equal(envelope.data.report_name, "sample-report.pdf");
  assert.equal(envelope.data.report_url, "https://example.invalid/sample-report.pdf");
});

test("Finished closes Cell, image, Tower, user, then Assignment with exact payloads", async () => {
  const { repository, service } = setup();
  await service.finish(finishBody);
  assert.deepEqual(repository.state.get("cell/sector_1_g900_ASG-SAMPLE-010"), {
    closed_date: "2026-07-27",
    closed_datetime: "2026-07-27 13:14:15",
    rcell_id: "sector_1_g900_ASG-SAMPLE-010",
  });
  assert.deepEqual(repository.state.get("tower/TOWER-SAMPLE-010"), {
    radaba_status: "Yes",
    region_radaba_status: "West_Yes",
    sub_region_radaba_status: "Sample Subregion_Yes",
  });
  assert.equal(
    repository.state.get("user/rigger@example.invalid").position_radaba_status,
    "Rigger_Yes",
  );
  const assignment = repository.state.get("assignment/assignment-key");
  assert.equal(assignment.index_created_date_assignment_state, "Finished_2026-07-20");
  assert.equal(assignment.index_closed_date_completed, "false_2026-07-27");
  assert.equal(assignment.index_closed_date_ftp_check, "Not Available_2026-07-27");
});

test("achievement fan-out is exact for National, West, and CCSI", async () => {
  const { repository, service } = setup();
  await service.finish(finishBody);
  const productivityReads = repository.operations.filter(
    (item) => item.type === "read" && item.path.startsWith("achievement/productivity/"),
  );
  const productivityTransactions = repository.operations.filter(
    (item) => item.type === "transaction" &&
      item.path.startsWith("achievement/productivity/"),
  );
  assert.equal(productivityReads.length, 9);
  assert.equal(productivityTransactions.length, 9);
  assert.deepEqual(
    [...new Set(productivityReads.map((item) => item.path.split("/").at(-1)))],
    ["national", "region", "company"],
  );
  assert.equal(
    repository.operations.filter((item) =>
      item.path.startsWith("achievement/rigger/2026 jul")).length,
    3,
  );
});

test("missing Assignment returns legacy HTTP 200 before related reads", async () => {
  const { repository, service } = setup({ assignments: [] });
  const response = await handler(service)(request());
  assert.deepEqual(await response.json(), {
    code: 200, message: "success", data: "The assignment not found",
  });
  assert.deepEqual(repository.operations.map((item) => item.path), ["assignment"]);
});

test("missing rigger skips user mutation but preserves rigger achievement", async () => {
  const { repository, service } = setup({ users: [] });
  await service.finish(finishBody);
  assert.equal(
    repository.operations.filter((item) => item.type === "update-query" &&
      item.path === "user").length,
    0,
  );
  assert.equal(
    repository.operations.some((item) =>
      item.path.startsWith("achievement/rigger/2026 jul")),
    true,
  );
});

test("unknown, null, false, zero, and plural images_status preserve legacy mapping", async () => {
  const body = {
    ...finishBody,
    report_name: "",
    report_url: null,
    image_status: false,
    unknown: 0,
  };
  const update = await setup().service.finish(body);
  assert.equal(update.report_name, "");
  assert.equal(update.report_url, null);
  assert.equal(update.image_status, false);
  assert.equal(Object.hasOwn(update, "images_status"), false);
  assert.equal(Object.hasOwn(update, "unknown"), false);
});

test("every sequential pre-fan-out failure stops at the exact operation", async () => {
  for (let failAt = 1; failAt <= 7; failAt += 1) {
    const { repository, service } = setup({ failAt });
    const response = await handler(service)(request());
    assert.equal(response.status, 500);
    assert.equal(repository.operations.length, failAt);
    assert.match((await response.json()).data, new RegExp(`failure ${failAt}`));
  }
});

test("achievement failure occurs after Assignment closure and returns raw 500", async () => {
  const { repository, service } = setup({
    failPath: "achievement/productivity/2026/daily/national",
  });
  const response = await handler(service)(request());
  assert.equal(response.status, 500);
  assert.equal(repository.state.has("assignment/assignment-key"), true);
  assert.match((await response.json()).data, /achievement[/]productivity/);
});

test("replay increments achievement rows and regenerates no duplicate logical index", async () => {
  const { repository, service } = setup();
  await service.finish(finishBody);
  await service.finish(finishBody);
  const productivity = [...repository.state.entries()].filter(([key]) =>
    key.startsWith("achievement/productivity/") && !key.includes("|"));
  const rigger = [...repository.state.entries()].filter(([key]) =>
    key.startsWith("achievement/rigger/") && !key.includes("|"));
  assert.equal(productivity.length, 9);
  assert.equal(rigger.length, 1);
  for (const [, value] of [...productivity, ...rigger]) assert.equal(value.total, 2);
  assert.equal(
    repository.operations.filter((item) => item.path === "assignment/assignment-key").length,
    2,
  );
});

test("route and repository write-path allowlist excludes Auth, Storage, logs, and metrics", () => {
  const files = [
    "src/app/api/mobile/updateAssignmentDetails/route.ts",
    "src/server/mobile-api/services/mobile-assignment-finish-service.mjs",
    "src/server/mobile-api/repositories/firebase-mobile-assignment-finish-repository.ts",
  ].map((name) => fs.readFileSync(path.join(process.cwd(), name), "utf8")).join("\n");
  assert.doesNotMatch(files, /firebaseAdminAuth|getAuth|getStorage|storageBucket|TABLE_LOG/);
  assert.doesNotMatch(files, /metrics_markers|assignments_by_closed_date|[/]metrics[/]/);
  for (const pathName of ["assignment", "cell", "image", "tower", "user", "achievement"]) {
    assert.match(files, new RegExp(pathName, "i"));
  }
});

test("Android Finished request and AssignmentUpdateStateResponse remain compatible", async () => {
  assert.deepEqual(Object.keys(finishBody), [
    "assignment_state",
    "assignment_id",
    "tower_id",
    "rigger_email",
    "report_name",
    "report_url",
    "images_status",
    "assignment_status",
  ]);
  const result = await setup().service.finish(finishBody);
  for (const field of [
    "assignment_state", "assignment_status", "closed_date", "closed_datetime",
  ]) {
    assert.equal(typeof result[field], "string");
  }
});

test("fixture and runtime contain no operational secrets or production identifiers", () => {
  const text = fs.readFileSync(
    path.join(process.cwd(), "tests/fixtures/mobile-assignment-finish-fixtures.js"),
    "utf8",
  );
  assert.match(text, /example[.]invalid/);
  assert.doesNotMatch(
    text,
    /PRIVATE KEY|eyJ[A-Za-z0-9_-]{20,}[.]eyJ|AIza|Bearer|firebaseio[.]com/i,
  );
});

