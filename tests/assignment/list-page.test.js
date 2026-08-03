import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  parseAssignmentListParams,
  defaultAssignmentDates,
} from "../../src/features/assignment/assignment-list-params.mjs";
import { assignmentStatusTone } from "../../src/features/assignment/assignment-status.mjs";
import { mapRawAssignmentToListItem } from "../../src/features/assignment/assignment-mapper.mjs";
import { canAccessAssignment } from "../../src/features/assignment/assignment-privilege.mjs";
import { assignmentFixtures } from "../fixtures/assignment-fixtures.js";

const clientSource = () =>
  readFile(
    new URL("../../src/components/assignment/assignment-page-client.tsx", import.meta.url),
    "utf8",
  );
const pageSource = () =>
  readFile(new URL("../../src/app/home/assignment/page.tsx", import.meta.url), "utf8");

test("parses defaults in Jakarta and validates URL pagination and filters", () => {
  const now = new Date("2026-01-10T17:30:00Z");
  assert.deepEqual(defaultAssignmentDates(now), { startDate: "2026-01-03", endDate: "2026-01-11" });
  assert.deepEqual(
    parseAssignmentListParams(
      {
        timeBasis: "onFinish",
        startDate: "2026-01-01",
        endDate: "2026-01-09",
        page: "2",
        pageSize: "25",
        region: "Test Region",
      },
      now,
    ),
    {
      timeBasis: "onFinish",
      startDate: "2026-01-01",
      endDate: "2026-01-09",
      page: 2,
      pageSize: 25,
      filterCategory: "region",
      filterValues: ["Test Region"],
    },
  );
});

test("falls back safely for malformed URL filters", () => {
  assert.equal(parseAssignmentListParams({ page: "0" }).page, 1);
  assert.match(
    parseAssignmentListParams({ startDate: "01-01-2026" }).startDate,
    /^\d{4}-\d{2}-\d{2}$/,
  );
  assert.equal(
    parseAssignmentListParams({ status: "Open", region: "Test" }).filterCategory,
    "status",
  );
});

test("maps all legacy status colors and unknown to gray", () => {
  const expected = {
    Open: "blue",
    Accepted: "blue",
    "On Progress": "amber",
    Paused: "amber",
    Finished: "green",
    Rejected: "red",
    Dropped: "red",
  };
  for (const [status, tone] of Object.entries(expected))
    assert.equal(assignmentStatusTone(status), tone);
  assert.equal(assignmentStatusTone("Unexpected"), "gray");
});

test("integrates sanitized repository-shaped fixtures with the mapper", () => {
  const mockSnapshot = Object.entries({
    "-one": assignmentFixtures.numericImageTotal,
    "-two": assignmentFixtures.missingOptional,
  });
  const rows = mockSnapshot.map(([key, value]) => mapRawAssignmentToListItem(key, value));
  assert.equal(rows[0].image_total, 12);
  assert.equal(rows[1].region, null);
});

test("enforces denied and allowed privilege before repository construction", async () => {
  assert.equal(canAccessAssignment([{ path: "/assignment", manager: false }], "manager"), false);
  assert.equal(canAccessAssignment([{ path: "/assignment", manager: true }], "manager"), true);
  const source = await pageSource();
  assert.ok(
    source.indexOf("canAccessAssignment") < source.indexOf("new FirebaseAssignmentReadRepository"),
  );
});

test("contains desktop table and mobile card rendering contracts", async () => {
  const source = await clientSource();
  assert.match(source, /<table/);
  assert.match(source, /md:block/);
  assert.match(source, /md:hidden/);
  assert.match(source, /<article/);
  for (const label of [
    "Assignment ID",
    "Status",
    "Region",
    "Rigger",
    "Assignment Time",
    "Finished Time",
    "Image Total",
    "View",
  ])
    assert.ok(source.includes(label));
});

test("desktop Assignment headers align with every rendered row cell", async () => {
  const source = await clientSource();
  const headers = source.match(
    /\[\s*"#",[\s\S]*?"Actions",\s*\]\.map\(\(header\)/,
  )?.[0];
  const row = source.match(
    /function AssignmentRow[\s\S]*?return \([\s\S]*?<tr[\s\S]*?<\/tr>/,
  )?.[0];

  assert.ok(headers, "desktop header definition should be present");
  assert.ok(row, "desktop Assignment row should be present");
  assert.deepEqual(
    [...headers.matchAll(/"([^"]+)"/g)].map((match) => match[1]),
    [
      "#",
      "Assignment ID",
      "Region",
      "Sub-region",
      "Partner",
      "Rigger",
      "Status",
      "SLA Status",
      "Aging",
      "Assignment Time",
      "Finished Time",
      "Image Total",
      "Actions",
    ],
  );
  assert.equal((row.match(/<td\b/g) ?? []).length, 13);
});
test("Assignment list uses a proper em dash for unavailable values", async () => {
  const source = await clientSource();
  assert.ok(source.includes('"—"'));
  assert.doesNotMatch(source, /â€”/);
});
test("pagination avoids a fabricated total", async () => {
  const source = await clientSource();
  assert.match(source, /const first = rows\.length/);
  assert.match(source, /\{first\}.+\{last\}/);
  assert.match(source, /\{first\}–\{last\}/);
  assert.doesNotMatch(source, /\{first\}â€“\{last\}/);
  assert.match(source, /Rows per page/);
  assert.ok(source.includes("Previous"));
  assert.ok(source.includes("Next"));
  assert.doesNotMatch(source, /total records/i);
});

test("Phase 7B adds no write method or browser Firebase access", async () => {
  const client = await clientSource();
  assert.doesNotMatch(client, /firebase|localStorage|sessionStorage/i);
});
