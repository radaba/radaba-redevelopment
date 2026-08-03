import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeAssignmentCoordinates,
  parseAssignmentMapParams,
  matchesAssignmentMapFilters,
} from "../../src/features/assignment/assignment-map-contract.mjs";

test("normalizes numeric and string coordinates without changing GeoJSON order", () => {
  assert.deepEqual(normalizeAssignmentCoordinates({ latitude: "-6.2", longitude: "106.8166" }), {
    state: "valid", latitude: -6.2, longitude: 106.8166, reason: null,
  });
  assert.equal(normalizeAssignmentCoordinates({ latitude: 0, longitude: 0 }).state, "valid");
});

test("classifies missing, invalid, and possibly reversed coordinates without correcting records", () => {
  assert.equal(normalizeAssignmentCoordinates({ latitude: "", longitude: null }).state, "missing");
  assert.equal(normalizeAssignmentCoordinates({ latitude: "nope", longitude: 100 }).state, "invalid");
  assert.equal(normalizeAssignmentCoordinates({ latitude: 106.8, longitude: -6.2 }).state, "possibly-reversed");
  assert.equal(normalizeAssignmentCoordinates({ latitude: 200, longitude: 200 }).state, "invalid");
});

test("map parameters retain Dashboard bounds and validate SLA/status values", () => {
  const now = new Date("2026-07-25T12:00:00Z");
  const filters = parseAssignmentMapParams({
    preset: "custom", startDate: "2026-07-01", endDate: "2026-07-25",
    status: "Paused", slaState: "Escalated", keyword: " TNG ",
  }, now);
  assert.equal(filters.status, "Paused");
  assert.equal(filters.slaState, "Escalated");
  assert.equal(filters.keyword, "TNG");
  assert.equal(parseAssignmentMapParams({ status: "Travelling", slaState: "Late" }, now).status, "");
});

test("filters by people, category, region, status, SLA, and geographic keyword fields", () => {
  const record = {
    assignment_id: "A-1", tower_id: "TNG-1", sitename: "Central",
    new_cluster_name: "Cluster Alpha", region: "Jabodetabek", sub_region: "West",
    assignment_category: "Audit", assignment_state: "Paused",
    coordinator_name: "Coordinator A", rigger_name: "Rigger A",
  };
  const filters = parseAssignmentMapParams({
    startDate: "2026-07-01", endDate: "2026-07-25", coordinator: "Coordinator A",
    rigger: "Rigger A", category: "Audit", region: "Jabodetabek",
    status: "Paused", slaState: "Warning", keyword: "cluster alpha",
  });
  assert.equal(matchesAssignmentMapFilters(record, { state: "Warning" }, filters), true);
  assert.equal(matchesAssignmentMapFilters(record, { state: "Overdue" }, filters), false);
});
