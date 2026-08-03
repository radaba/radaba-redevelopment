import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { mapRawAssignmentToListItem } from "../../src/features/assignment/assignment-mapper.mjs";
import { isTerminalAssignment } from "../../src/features/assignment/assignment-command-contract.mjs";
import { relatedAssignmentRecords } from "../fixtures/tower-related-assignment-fixtures.js";

const read = (path) => fs.readFileSync(path, "utf8");

test("existing Assignment mapper exposes proven related-list fields and tolerates sparse history", () => {
  const complete = mapRawAssignmentToListItem(
    relatedAssignmentRecords[0].key,
    relatedAssignmentRecords[0].value,
  );
  assert.equal(complete.assignment_category, "Corrective");
  assert.equal(complete.rno_name, "RNO One");
  assert.equal(complete.coordinator_name, "Coordinator One");
  const sparse = mapRawAssignmentToListItem(
    relatedAssignmentRecords[2].key,
    relatedAssignmentRecords[2].value,
  );
  assert.equal(sparse.assignment_id, "314");
  assert.equal(sparse.assignment_category, null);
  assert.equal(sparse.rigger_name, null);
});

test("related query uses exact tower_id, explicit bounds, stable bounded ordering, and no writes", () => {
  const source = read("src/server/assignment/firebase-assignment-repository.ts");
  const contract = read("src/server/assignment/assignment-repository.ts");
  assert.match(source, /findRecentByTowerId/);
  assert.match(source, /orderByChild\("tower_id"\)/);
  assert.match(source, /\.equalTo\(exactTowerId\)/);
  assert.match(source, /\.limitToLast\(boundedLimit\)/);
  assert.match(source, /created_datetime/);
  assert.match(source, /b\.key\.localeCompare\(a\.key\)/);
  assert.match(contract, /RELATED_ASSIGNMENT_DEFAULT_LIMIT = 20/);
  assert.match(contract, /RELATED_ASSIGNMENT_MAXIMUM_LIMIT = 50/);
  assert.doesNotMatch(
    source.slice(source.indexOf("findRecentByTowerId"), source.indexOf("async list(")),
    /\.set\(|\.update\(|\.remove\(/,
  );
});

test("missing tower_id performs no Assignment or Cell relationship query", () => {
  const repository = read("src/server/tower-workspace/firebase-tower-workspace-repository.ts");
  assert.match(repository, /towerId\?await this\.assignments\.findRecentByTowerId\(towerId,20\):\[\]/);
  assert.match(repository, /if\(towerId\)queries\.push/);
  assert.match(repository, /if\(primaryAssignmentId\)queries\.push/);
  assert.doesNotMatch(repository, /findRecentByTowerId\(""/);
});

test("terminal classification reuses the shared Assignment helper", () => {
  assert.equal(isTerminalAssignment(relatedAssignmentRecords[1].value), true);
  assert.equal(isTerminalAssignment(relatedAssignmentRecords[0].value), false);
  const component = read("src/components/tower/tower-related-assignments.tsx");
  assert.match(component, /isTerminalAssignment/);
});

test("Related Assignments renders bounded summary, desktop table, mobile cards, and safe states", () => {
  const component = read("src/components/tower/tower-related-assignments.tsx");
  for (const phrase of [
    "Related Assignments",
    "Records shown",
    "Active records shown",
    "Terminal records shown",
    "Latest Assignment date",
    "Bounded Related Assignment summary",
    "No related Assignments",
    "has no Tower ID",
    "could not be loaded",
    "lg:block",
    "lg:hidden",
  ]) {
    assert.match(component, new RegExp(phrase));
  }
  assert.doesNotMatch(component, /Total Assignments|global total/i);
});

test("View Assignment uses the existing push-key detail route with accessible wrapping", () => {
  const component = read("src/components/tower/tower-related-assignments.tsx");
  assert.match(component, /\/home\/assignment\/\$\{encodeURIComponent\(row\.key\)\}/);
  assert.match(component, /aria-label=\{`View Assignment/);
  assert.match(component, /break-all/);
  assert.match(component, /focus-visible:ring-2/);
});

test("Tower detail retains page authorization and adds no related mutation API", () => {
  const page = read("src/app/home/towers/[towerKey]/page.tsx");
  const routes = fs
    .readdirSync("src/app/api/towers/[towerKey]", { withFileTypes: true })
    .map((entry) => entry.name);
  assert.match(page, /canAccessAssignment/);
  assert.match(page, /toLowerCase\(\) !== "active"/);
  assert.equal(routes.includes("assignments"), false);
});
