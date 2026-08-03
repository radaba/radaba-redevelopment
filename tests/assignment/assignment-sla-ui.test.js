import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parseAssignmentListParams } from "../../src/features/assignment/assignment-list-params.mjs";
import { buildAssignmentDashboard } from "../../src/features/assignment/assignment-dashboard-metrics.mjs";

const source = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("parses only supported SLA and aging filters", () => {
  const parsed = parseAssignmentListParams({
    slaState: "Overdue", agingBucket: "8-14",
    startDate: "2026-07-01", endDate: "2026-07-25",
  });
  assert.equal(parsed.slaState, "Overdue");
  assert.equal(parsed.agingBucket, "8-14");
  const invalid = parseAssignmentListParams({ slaState: "late", agingBucket: "forever" });
  assert.equal(invalid.slaState, undefined);
  assert.equal(invalid.agingBucket, undefined);
});

test("dashboard aggregates SLA states and aging buckets", () => {
  const data = buildAssignmentDashboard([
    { key: "open", value: { assignment_state: "Open", created_datetime: "2026-07-23 11:00:00", created_date: "2026-07-23" } },
    { key: "done", value: { assignment_state: "Finished", created_datetime: "2026-07-01 12:00:00", created_date: "2026-07-01", completed_datetime: "2026-07-03 12:00:00" } },
  ], { startDate: "2026-07-01", endDate: "2026-07-25" }, new Date("2026-07-25T12:00:00Z"));
  assert.equal(data.slaSummary.find(({ label }) => label === "Escalated").value, 1);
  assert.equal(data.agingBuckets.reduce((sum, item) => sum + item.value, 0), 2);
});

test("list and detail expose accessible text SLA indicators without workflow writes", () => {
  const list = source("src/components/assignment/assignment-page-client.tsx");
  const detail = source("src/components/assignment/assignment-sla-panel.tsx");
  const page = source("src/app/home/assignment/[assignmentId]/page.tsx");
  assert.match(list, /Warning only/);
  assert.match(list, /Aging bucket/);
  assert.match(list, /AssignmentSlaBadge/);
  assert.match(detail, /SLA &amp; aging/);
  assert.match(detail, /No notification is sent/);
  assert.match(page, /evaluateAssignmentSla/);
  assert.doesNotMatch(detail, /fetch\(|update\(|set\(/);
});
