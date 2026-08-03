import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  towerSpecificationStatus,
  towerSpecificationValuePresent,
} from "../../src/features/assignment/assignment-tower-snapshot-contract.mjs";

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8");

test("detail route authorizes before push-key repository access", async () => {
  const source = await read("src/app/home/assignment/[assignmentId]/page.tsx");
  assert.ok(source.indexOf("canAccessAssignment") < source.indexOf("findByKey"));
  assert.match(source, /findByKey\(assignmentKey\)/);
  assert.match(source, /notFound\(\)/);
  assert.match(source, /mapRawAssignmentToDetail/);
});

test("detail lookup reads exactly one existing assignment child", async () => {
  const contract = await read("src/server/assignment/assignment-repository.ts");
  const repository = await read("src/server/assignment/firebase-assignment-repository.ts");
  assert.match(contract, /findByKey/);
  assert.match(repository, /ref\(ASSIGNMENT_RTDB_PATH\)\.child\(key\)/);
  assert.match(repository, /snapshot\.exists\(\)/);
  assert.doesNotMatch(repository, /findByKey[\s\S]{0,400}\.(set|update|remove|push)\(/);
});

test("detail mapper exposes confirmed legacy fields without schema changes", async () => {
  const source = await read("src/features/assignment/assignment-detail.ts");
  for (const field of [
    "assignment_id",
    "assignment_description",
    "assignment_category",
    "tower_id",
    "plan_date",
    "created_datetime",
    "report_url",
  ])
    assert.ok(source.includes(field));
  assert.doesNotMatch(source, /priority|completionPercentage|dueDate|comments|attachments/i);
});

test("detail dashboard is responsive, scannable, and uses supported actions", async () => {
  const source = await read("src/components/assignment/assignment-detail.tsx");
  for (const text of [
    "General information",
    "Site and location",
    "Lifecycle",
    "Operational status",
    "People",
    "Key dates",
    "Quick actions",
    "No report available",
  ])
    assert.ok(source.includes(text));
  assert.match(source, /xl:grid-cols-\[minmax\(0,2fr\)_minmax\(18rem,1fr\)\]/);
  assert.match(source, /xl:sticky/);
  assert.match(source, /AssignmentReassignRiggerDialog/);
  assert.doesNotMatch(source, />Delete<|>Duplicate<|>Edit Assignment</);
});

test("detail image totals preserve known values and use a proper em dash when unavailable", async () => {
  const component = await read("src/components/assignment/assignment-detail.tsx");
  const mapper = await read("src/features/assignment/assignment-detail.ts");

  assert.match(component, /const missing = "—"/);
  assert.doesNotMatch(component, /â€”/);
  assert.match(
    component,
    /detail\.imageTotal === null \|\| detail\.imageTotal === undefined[\s\S]*?String\(detail\.imageTotal\)/,
  );
  assert.match(
    component,
    /value === null \|\| value === undefined \|\| value === "" \? missing : String\(value\)/,
  );
  assert.match(mapper, /imageTotal: raw\.image_total/);
});
test("detail page has local breadcrumb, print and refresh controls, and skeleton loading", async () => {
  const detail = await read("src/components/assignment/assignment-detail.tsx");
  const actions = await read("src/components/assignment/assignment-detail-actions.tsx");
  const loading = await read("src/app/home/assignment/[assignmentId]/loading.tsx");
  assert.match(detail, /Assignment breadcrumb/);
  assert.match(actions, /router\.refresh\(\)/);
  assert.match(actions, /window\.print\(\)/);
  assert.match(actions, /motion-reduce:animate-none/);
  assert.match(loading, /animate-pulse/);
  assert.match(loading, /role="status"/);
});
test("detail network configuration maps every Assignment snapshot band in exact grouped order", async () => {
  const mapper = await read("src/features/assignment/assignment-detail.ts");
  const component = await read("src/components/assignment/assignment-detail.tsx");
  const ordered = [
    ["GSM 900", "g900"],
    ["GSM 1800", "g1800"],
    ["UMTS 900", "u900"],
    ["UMTS 2100", "u2100"],
    ["L700", "l700"],
    ["L850", "l850"],
    ["LTE 900", "l900"],
    ["LTE 1800", "l1800"],
    ["LTE 2100", "l2100"],
    ["L2300", "l2300"],
    ["L2600", "l2600"],
  ];
  let position = -1;
  for (const [label, field] of ordered) {
    const next = mapper.indexOf('{ label: "' + label + '", value: raw.' + field + ' }');
    assert.ok(next > position, label + " must follow the requested order");
    position = next;
  }
  for (const title of ["2G", "3G", "4G / LTE"]) assert.ok(component.includes('title: "' + title + '"'));
  assert.match(component, /title="Network Configuration"/);
  assert.match(component, /Operational values stored in this Assignment's Tower snapshot./);
  assert.match(component, /rounded-xl border border-slate-200 bg-slate-50 p-4/);
});

test("detail network configuration preserves zero and renders missing legacy bands as Not available", async () => {
  const component = await read("src/components/assignment/assignment-detail.tsx");
  assert.match(component, /const networkMissing = "Not available"/);
  assert.ok(component.includes('value === null || value === undefined'));
  assert.ok(component.includes('? networkMissing'));
  assert.ok(component.includes(': String(value)'));
  assert.equal(component.includes("value || networkMissing"), false);
  assert.ok(component.includes("?? { label, value: undefined }"));
  assert.ok(component.includes("networkDisplay(item.value)"));
});

test("Assignment Detail reads only the Assignment snapshot and declares the expanded optional fields", async () => {
  const route = await read("src/app/home/assignment/[assignmentId]/page.tsx");
  const types = await read("src/features/assignment/assignment-types.ts");
  const creation = await read("src/server/assignment/assignment-command-service.ts");
  assert.ok(types.includes("l700?: LegacyAssignmentScalar"));
  assert.ok(types.includes("l2600?: LegacyAssignmentScalar"));
  assert.doesNotMatch(route, /TowerRepository|findByTower|ref(["'](?:tower|cell|image)["'])/);
  assert.match(route, /FirebaseAssignmentReadRepository/);
  assert.doesNotMatch(creation, /"l700"|"l2600"/);
});
test("Tower Specification maps image-owned Assignment snapshots without live fallbacks", async () => {
  const route = await read("src/app/home/assignment/[assignmentId]/page.tsx"),
    mapper = await read("src/features/assignment/assignment-detail.ts"),
    component = await read("src/components/assignment/assignment-detail.tsx");
  for (const [raw, mapped] of [
    ["tower_type", "towerType"],
    ["tower_height", "towerHeight"],
    ["total_antenna", "totalAntenna"],
    ["total_rru", "totalRru"],
    ["single_sector", "singleSector"],
    ["multi_sector", "multiSector"],
    ["route_distance", "routeDistance"],
    ["justifikasi", "justification"],
  ])
    assert.match(mapper, new RegExp(`${mapped}: raw\\.${raw}`));
  for (const label of [
    "Tower Type",
    "Tower Height",
    "Total Antenna",
    "Total RRU",
    "Single Sector",
    "Multi Sector",
    "Route Distance",
    "Justifikasi",
  ])
    assert.ok(component.includes(label));
  assert.match(component, /title="Tower Specification"/);
  assert.match(component, /value === null \|\| value === undefined/);
  assert.doesNotMatch(route, /TowerRepository|findByTower|ref\(["'](?:tower|image|cell)["']\)/);
});

test("Tower Specification derives not-submitted partial and available snapshot-only states", async () => {
  const mapper = await read("src/features/assignment/assignment-detail.ts"),
    component = await read("src/components/assignment/assignment-detail.tsx"),
    route = await read("src/app/home/assignment/[assignmentId]/page.tsx");
  assert.equal(towerSpecificationStatus(Array(8).fill(undefined)), "not_submitted");
  assert.equal(towerSpecificationStatus(["monopole", ...Array(7).fill(null)]), "partial");
  assert.equal(towerSpecificationStatus(["a", "b", "c", "d", "e", "f", "g", "h"]), "available");
  assert.equal(towerSpecificationValuePresent("0"), true);
  assert.equal(towerSpecificationValuePresent(0), true);
  assert.equal(towerSpecificationValuePresent("   "), false);
  assert.match(mapper, /towerSpecificationStatus\(values\)/);
  assert.match(component, /towerSpecificationStatus === "not_submitted"/);
  assert.match(component, /Full Tower specification has not been submitted for this Assignment\./);
  assert.match(component, /Complete the Full Tower form from the mobile application/);
  assert.match(component, /Source: Assignment snapshot/);
  assert.match(component, /Source record: No matching Full Tower submission/);
  assert.match(route, /showAdministratorDiagnostic=\{String\(user\.role\).*?=== "super_admin"\}/);
  assert.doesNotMatch(route, /ref\(["'](?:image|cell)["']\)|orderByChild\(["']assignment_id["']\)/);
});
