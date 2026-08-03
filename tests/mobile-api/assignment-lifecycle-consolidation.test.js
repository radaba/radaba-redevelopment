import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createMobileAssignmentTransitionService } from "../../src/server/mobile-api/services/mobile-assignment-transition-service.mjs";
import { lifecycleFailureModel, lifecycleParityMatrix, lifecycleWritePathAllowlist } from "../fixtures/mobile-assignment-lifecycle-parity-fixtures.js";
import { androidTransitionBodies, transitionAssignment } from "../fixtures/mobile-assignment-transition-fixtures.js";

const times = [
  { currDate: "2026-07-27", currDatetime: "2026-07-27 13:14:15", compactDate: "072726", sequenceSeconds: 1785158055 },
  { currDate: "2026-07-28", currDatetime: "2026-07-28 14:15:16", compactDate: "072826", sequenceSeconds: 1785244516 },
];

function setup() {
  const record = { key: "assignment-key", value: structuredClone(transitionAssignment) };
  const operations = [];
  let tick = 0;
  const repository = {
    async findAssignments() {
      operations.push("read:assignment");
      return [structuredClone(record)];
    },
    async findUsersByEmail() {
      operations.push("read:user");
      return [];
    },
    async updateAssignment(_key, update) {
      operations.push(`write:${update.assignment_state}`);
      Object.assign(record.value, structuredClone(update));
    },
  };
  const clock = { current: () => structuredClone(times[Math.min(tick++, 1)]) };
  return { record, operations, service: createMobileAssignmentTransitionService(repository, clock) };
}

test("machine-readable parity matrix is complete, serializable, and uniquely keyed", () => {
  assert.equal(lifecycleParityMatrix.length, 10);
  assert.equal(new Set(lifecycleParityMatrix.map((row) => `${row.route}:${row.state}`)).size, 10);
  assert.deepEqual(JSON.parse(JSON.stringify(lifecycleParityMatrix)), lifecycleParityMatrix);
  assert.equal(lifecycleParityMatrix.filter((row) => row.disposition === "exact").length, 4);
});

test("pause then resume is last-write-wins and retains the historical pause timestamp", async () => {
  const { record, service } = setup();
  await service.transition(androidTransitionBodies.pause);
  await service.transition(androidTransitionBodies.resume);
  assert.equal(record.value.assignment_state, "On Progress");
  assert.equal(record.value.paused_datetime, "2026-07-27 13:14:15");
  assert.match(record.value.rigger_email_assignment_status_assignment_id, /072826_1785244516$/);
});

test("resume is accepted without a paused source state", async () => {
  const { record, service } = setup();
  assert.equal(record.value.assignment_state, "Accepted");
  await service.transition(androidTransitionBodies.resume);
  assert.equal(record.value.assignment_state, "On Progress");
});

test("reject then pause reopens composite indexes but retains close and reason fields", async () => {
  const { record, service } = setup();
  await service.transition(androidTransitionBodies.reject);
  await service.transition(androidTransitionBodies.pause);
  assert.equal(record.value.assignment_state, "Paused");
  assert.equal(record.value.assignment_status, "Closed");
  assert.equal(record.value.reason, androidTransitionBodies.reject.reason);
  assert.match(record.value.rigger_email_assignment_status_tower_id, /_Open_/);
});

test("replaying pause overwrites timestamps and its sequence composite", async () => {
  const { record, operations, service } = setup();
  await service.transition(androidTransitionBodies.pause);
  const first = record.value.rigger_email_assignment_status_assignment_id;
  await service.transition(androidTransitionBodies.pause);
  assert.notEqual(record.value.rigger_email_assignment_status_assignment_id, first);
  assert.equal(record.value.paused_date, "2026-07-28");
  assert.equal(operations.filter((entry) => entry === "write:Paused").length, 2);
});

test("concurrent simple transitions share no request state and are repository last-write-wins", async () => {
  const record = { key: "assignment-key", value: structuredClone(transitionAssignment) };
  const repository = {
    findAssignments: async () => [structuredClone(record)],
    findUsersByEmail: async () => [],
    async updateAssignment(_key, update) {
      if (update.assignment_state === "Paused") await new Promise((resolve) => setTimeout(resolve, 10));
      Object.assign(record.value, structuredClone(update));
    },
  };
  const service = createMobileAssignmentTransitionService(repository, { current: () => times[0] });
  const [paused, resumed] = await Promise.all([
    service.transition(androidTransitionBodies.pause),
    service.transition(androidTransitionBodies.resume),
  ]);
  assert.equal(paused.assignment_state, "Paused");
  assert.equal(resumed.assignment_state, "On Progress");
  assert.equal(record.value.assignment_state, "Paused");
});

test("failure classification forbids automated retry assumptions", () => {
  assert.equal(lifecycleFailureModel.automaticRecovery, false);
  assert.equal(lifecycleFailureModel.safeRetry, false);
  assert.match(lifecycleFailureModel.finished, /non-atomic/);
});

test("shadow contract keeps the lifecycle write surface constrained", () => {
  assert.deepEqual(lifecycleWritePathAllowlist, ["assignment", "cell", "image", "tower", "user", "achievement"]);
  const sources = [
    "src/server/mobile-api/services/mobile-assignment-transition-service.mjs",
    "src/server/mobile-api/services/mobile-assignment-finish-service.mjs",
    "src/server/mobile-api/repositories/firebase-mobile-assignment-command-repository.ts",
    "src/server/mobile-api/repositories/firebase-mobile-assignment-finish-repository.ts",
  ].map((file) => fs.readFileSync(path.join(process.cwd(), file), "utf8")).join("\n");
  assert.doesNotMatch(sources, /getAuth|getStorage|storageBucket|metrics_markers|repair_marker/i);
});

test("consolidation documentation exists for every required analysis", () => {
  for (const name of [
    "phase-m9r-d-consolidation.md", "m9r-d-master-route-matrix.md",
    "m9r-d-state-transition-map.md", "m9r-d-replay-matrix.md",
    "m9r-d-failure-matrix.md", "m9r-d-partial-state-recovery.md",
    "m9r-d-invariant-analysis.md", "m9r-d-rtdb-path-audit.md",
    "m9r-d-timestamp-audit.md", "m9r-d-concurrency-review.md",
    "m9r-d-security-exposure-matrix.md", "m9r-d-performance-review.md",
    "m9r-d-migration-readiness.md",
  ]) {
    assert.equal(fs.existsSync(path.join(process.cwd(), ".docs/mobile-api-compatibility", name)), true, name);
  }
});
