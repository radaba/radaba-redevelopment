import assert from "node:assert/strict";
import test from "node:test";
import {
  CANONICAL_PRIVILEGES,
  canonicalPrivilegeById,
  classifyPersistedPrivilegeRecords,
  compatibilityPrivilegeIdsForPath,
  duplicatePersistedPrivilegePaths,
} from "../../src/features/admin/privilege-registry.mjs";

test("canonical registry has exactly eleven stable definitions in approved order", () => {
  assert.equal(CANONICAL_PRIVILEGES.length, 11);
  assert.deepEqual(CANONICAL_PRIVILEGES.map((item) => item.id), [
    "assignment", "assignment_dashboard", "towers", "cells", "aor_reports",
    "riggers", "users", "roles", "privileges", "audit_center", "assignment_maintenance",
  ]);
  assert.deepEqual(CANONICAL_PRIVILEGES.map((item) => item.order), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
});

test("registry contains six Operations and five Administration privileges", () => {
  assert.equal(CANONICAL_PRIVILEGES.filter((item) => item.section === "operations").length, 6);
  assert.equal(CANONICAL_PRIVILEGES.filter((item) => item.section === "administration").length, 5);
});

test("Profile Settings and detail routes are outside the editable registry", () => {
  const labels = CANONICAL_PRIVILEGES.map((item) => item.label);
  const routes = CANONICAL_PRIVILEGES.map((item) => item.navigationRoute);
  assert.equal(labels.includes("Profile"), false);
  assert.equal(labels.includes("Settings"), false);
  assert.equal(routes.some((route) => /\[[^\]]+\]/.test(route)), false);
  assert.equal(routes.some((route) => /\/history$/.test(route)), false);
});

test("canonical paths and identifiers are unique", () => {
  assert.equal(new Set(CANONICAL_PRIVILEGES.map((item) => item.id)).size, 11);
  assert.equal(new Set(CANONICAL_PRIVILEGES.map((item) => item.persistedPath)).size, 11);
});

test("duplicate persisted paths are detected without changing records", () => {
  const records = [
    { key: "a", path: "/assignment" },
    { key: "b", path: "/assignment" },
    { key: "c", path: "/invoice" },
  ];
  assert.deepEqual(duplicatePersistedPrivilegePaths(records), [
    { path: "/assignment", keys: ["a", "b"] },
  ]);
  assert.deepEqual(records[0], { key: "a", path: "/assignment" });
});

test("unknown and malformed records remain classified outside canonical support", () => {
  const [unknown, malformed] = classifyPersistedPrivilegeRecords([
    { key: "legacy", path: "/invoice" },
    { key: "broken", page_name: "No path" },
  ]);
  assert.equal(unknown.classification, "unsupported");
  assert.deepEqual(unknown.canonicalIds, []);
  assert.equal(malformed.classification, "malformed");
  assert.deepEqual(malformed.canonicalIds, []);
});

test("legacy compatibility paths map explicitly and do not become canonical definitions", () => {
  assert.deepEqual(compatibilityPrivilegeIdsForPath("/towerdatabase"), ["towers"]);
  assert.deepEqual(compatibilityPrivilegeIdsForPath("/rcell"), ["cells"]);
  assert.deepEqual(compatibilityPrivilegeIdsForPath("/antennareport"), ["aor_reports"]);
  assert.equal(CANONICAL_PRIVILEGES.some((item) => item.persistedPath === "/towerdatabase"), false);
});

test("legacy Assignment compatibility covers all six operational modules", () => {
  assert.deepEqual(compatibilityPrivilegeIdsForPath("/assignment"), [
    "assignment", "assignment_dashboard", "towers", "cells", "aor_reports", "riggers",
  ]);
});

test("canonical lookup returns metadata without accepting arbitrary identifiers", () => {
  assert.equal(canonicalPrivilegeById("privileges")?.persistedPath, "/privilege");
  assert.equal(canonicalPrivilegeById("profile"), null);
});
