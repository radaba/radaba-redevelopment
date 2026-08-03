import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  ASSIGNMENT_DASHBOARD_MAX_RECORDS,
  dashboardPresetDates,
  parseAssignmentDashboardParams,
} from "../../src/features/assignment/assignment-dashboard-contract.mjs";
import {
  assignmentDashboardTimestamp,
  buildAssignmentDashboard,
} from "../../src/features/assignment/assignment-dashboard-metrics.mjs";

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8");
const filters = (overrides = {}) => ({
  preset: "last30", startDate: "2026-07-01", endDate: "2026-07-30",
  coordinator: "", rigger: "", category: "", status: "", keyword: "", error: null,
  ...overrides,
});
const record = (key, overrides = {}) => ({ key, value: {
  assignment_id: key, tower_id: `T-${key}`, created_date: "2026-07-01",
  created_datetime: "2026-07-01 08:00:00", assignment_state: "Open",
  assignment_status: "Open", completed: false, coordinator_name: "Coordinator A",
  rigger_name: "Rigger A", assignment_category: "Audit", ...overrides,
} });

test("dashboard presets and custom ranges are bounded and deterministic", () => {
  const now = new Date("2026-07-30T10:00:00Z");
  assert.deepEqual(dashboardPresetDates("today", now), { startDate: "2026-07-30", endDate: "2026-07-30" });
  assert.deepEqual(dashboardPresetDates("last30", now), { startDate: "2026-07-01", endDate: "2026-07-30" });
  const invalid = parseAssignmentDashboardParams({ preset: "custom", startDate: "2024-01-01", endDate: "2026-07-30" }, now);
  assert.equal(invalid.error, "Date range cannot exceed one year.");
  assert.equal(ASSIGNMENT_DASHBOARD_MAX_RECORDS, 5000);
});

test("calculates status, completion, revisit, response, completion, and active-age KPIs", () => {
  const rows = [
    record("A", { assignment_state: "Finished", assignment_status: "Completed", completed: true, accepted_datetime: "2026-07-01 09:00:00", completed_date: "2026-07-30", completed_datetime: "2026-07-30 08:00:00", revisit_count: 2 }),
    record("B", { assignment_state: "Paused", accepted_datetime: "2026-07-01 10:00:00", paused_datetime: "2026-07-02 10:00:00" }),
    record("C", { assignment_state: "On Progress", rigger_name: "Rigger B", coordinator_name: "Coordinator B", assignment_category: "Install" }),
  ];
  const data = buildAssignmentDashboard(rows, filters(), new Date("2026-07-30T12:00:00Z"));
  assert.equal(data.kpis.total, 3);
  assert.equal(data.kpis.paused, 1);
  assert.equal(data.kpis.onProgress, 1);
  assert.equal(data.kpis.completedToday, 1);
  assert.equal(data.kpis.revisited, 1);
  assert.equal(data.kpis.averagePauseMs, null);
  assert.equal(data.kpis.averageCompletionMs, 29 * 86400000);
  assert.ok(data.kpis.averageAgeMs > 0);
  assert.ok(data.kpis.averageResponseMs > 0);
});

test("applies simultaneous people, category, status, and keyword filters", () => {
  const rows = [
    record("A", { assignment_description: "Antenna alignment" }),
    record("B", { coordinator_name: "Other", assignment_description: "Antenna alignment" }),
    record("C", { assignment_category: "Install", assignment_description: "Antenna alignment" }),
  ];
  const data = buildAssignmentDashboard(rows, filters({ coordinator: "Coordinator A", rigger: "Rigger A", category: "Audit", status: "Open", keyword: "antenna" }));
  assert.equal(data.filteredCount, 1);
  assert.equal(data.recentAssignments[0].key, "A");
});

test("groups coordinator and rigger workload with current-attribution completion rates", () => {
  const rows = [
    record("A", { assignment_state: "Finished", assignment_status: "Completed", completed: true, completed_datetime: "2026-07-02 08:00:00" }),
    record("B", { assignment_state: "Paused" }),
  ];
  const data = buildAssignmentDashboard(rows, filters());
  assert.equal(data.coordinators[0].total, 2);
  assert.equal(data.coordinators[0].completed, 1);
  assert.equal(data.coordinators[0].completionRate, 50);
  assert.equal(data.riggers[0].paused, 1);
});

test("timestamp parser rejects missing data and does not fabricate durations", () => {
  assert.equal(assignmentDashboardTimestamp("2026-07-01 08:30:00"), Date.UTC(2026, 6, 1, 8, 30));
  assert.equal(assignmentDashboardTimestamp("invalid"), null);
  const data = buildAssignmentDashboard([record("A")], filters());
  assert.equal(data.kpis.averageCompletionMs, null);
  assert.equal(data.kpis.averageResponseMs, null);
});

test("dashboard repository is bounded, read only, and samples nested activity", async () => {
  const source = await read("src/server/assignment/firebase-assignment-dashboard-repository.ts");
  assert.match(source, /orderByChild\("created_date"\)/);
  assert.match(source, /limitToLast\(maximum \+ 1\)/);
  assert.match(source, /\.slice\(0, 12\)/);
  assert.match(source, /assignment_comment/);
  assert.match(source, /assignment_photo/);
  assert.doesNotMatch(source, /\.(set|update|remove|transaction)\(/);
});

test("dashboard permission is enforced before repository construction", async () => {
  const page = await read("src/app/home/assignment/dashboard/page.tsx");
  assert.ok(page.indexOf("canAccessAssignment") < page.indexOf("new AssignmentDashboardService"));
  assert.match(page, /Permission denied/);
});

test("charts expose semantic labels, accessible data tables, and lazy loading", async () => {
  const dashboard = await read("src/components/assignment/assignment-dashboard.tsx");
  const charts = await read("src/components/assignment/assignment-dashboard-charts.tsx");
  assert.match(dashboard, /dynamic\(\(\) => import\("\.\/assignment-dashboard-charts"\)/);
  assert.match(charts, /role="img"/);
  assert.match(charts, /<title>/);
  assert.match(charts, /Accessible chart data/);
  assert.match(charts, /<table/);
  assert.match(dashboard, /Average Pause Duration/);
  assert.match(dashboard, /Resume timestamps are not stored/);
});

test("dashboard adds no Assignment workflow or command mutation", async () => {
  const workflow = await read("src/features/assignment/assignment-workflow.mjs");
  const service = await read("src/server/assignment/assignment-dashboard-service.ts");
  assert.doesNotMatch(service, /AssignmentCommandService|transitionAssignment|revisitAssignment/);
  assert.deepEqual((workflow.match(/accept|start|resume|complete|pause/g) || []).length > 0, true);
});

test("dashboard presents operational hierarchy, responsive workload, and route loading state", async () => {
  const dashboard = await read("src/components/assignment/assignment-dashboard.tsx");
  const charts = await read("src/components/assignment/assignment-dashboard-charts.tsx");
  const loading = await read("src/app/home/assignment/dashboard/loading.tsx");
  assert.match(dashboard, /Operations control/);
  assert.match(dashboard, /Average Response Time/);
  assert.match(dashboard, /Average Pause Duration is unavailable/);
  assert.match(dashboard, /lg:hidden/);
  assert.match(dashboard, /<caption/);
  assert.match(charts, /Assignment trends/);
  assert.match(charts, /aria-label="Trend view"/);
  assert.match(charts, /<caption/);
  assert.match(loading, /Loading Assignment dashboard/);
});
