import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (path) => fs.readFileSync(path, "utf8");
const ui = () => read("src/components/admin/admin-privileges-client.tsx");
const nav = () => read("src/components/application-shell/navigation-config.ts");
test("Privileges derives modules only from persisted privilege records", () => {
  const source = ui();
  assert.match(source, /new Set\(privileges\.map\(moduleName\)\)/);
  assert.match(source, /records: filtered\.filter/);
  assert.match(source, /record\.roleValues/);
  assert.doesNotMatch(source, /applicationNavigation|accessModules|Canonical access modules/);
});
test("self-service and navigation-only modules are absent from Privileges scope", () => {
  const source = ui();
  for (const value of [
    "Self-service � Always available",
    "authenticated personal workspace",
    "Dashboard",
    "AOR Reports",
    "Riggers",
    "Profile",
    "Settings",
    "Assignment Maintenance",
  ])
    assert.doesNotMatch(source, new RegExp(value));
});
test("actual stored Operations and Administration definitions remain renderable and editable", () => {
  const source = ui();
  for (const value of [
    /record\.page_name/,
    /record\.path/,
    /record\.category/,
    /record\.privilege_id/,
    /PrivilegeToggle/,
    /method: "PATCH"/,
    /previousValue/,
  ])
    assert.match(source, value);
  assert.match(source, /ADMIN_PATH = "\/privilege"/);
});
test("module KPI search comparison and review use only loaded privileges", () => {
  const source = ui();
  assert.match(source, /modules\.length/);
  assert.match(source, /privileges\.filter/);
  assert.match(source, /filtered\.length/);
  assert.match(source, /pending\.record/);
  assert.doesNotMatch(source, /14 modules/);
});
test("sidebar retains the complete independent 15-link navigation inventory", () => {
  const source = nav(),
    labels = [
      "Assignment",
      "Dashboard",
      "Towers",
      "Cells",
      "AOR Reports",
      "Riggers",
      "Profile",
      "Settings",
      "Users",
      "Roles",
      "Privileges",
      "Audit Center",
      "System Health",
      "Assignment Maintenance",
    ];
  assert.equal((source.match(/id: "/g) ?? []).length, 15);
  for (const label of labels) assert.match(source, new RegExp(`label: "${label}"`));
  assert.equal((source.match(/section: "Operations"/g) ?? []).length, 9);
  assert.equal((source.match(/section: "Administration"/g) ?? []).length, 6);
});
test("persisted privilege paths and authorization protections remain unchanged", () => {
  const repository = read("src/server/admin/firebase-admin-data-repository.ts"),
    admin = read("src/features/admin/admin-authorization.mjs"),
    assignment = read("src/features/assignment/assignment-privilege.mjs"),
    command = read("src/server/admin/admin-command-service.ts");
  assert.match(repository, /PRIVILEGE_PATH = "privilege"/);
  assert.match(repository, /\.child\(privilegeKey\)\.child\(role\)\.set\(enabled\)/);
  assert.match(assignment, /record\.path === ['"]\/assignment['"]/);
  assert.match(admin, /ADMINISTRATOR_PRIVILEGE_PATH = ['"]\/privilege['"]/);
  assert.match(command, /Final administrator access cannot be removed/);
});
