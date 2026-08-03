import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (path) => fs.readFileSync(path, "utf8");
const ui = () => read("src/components/admin/admin-privileges-client.tsx");

test("authorized route loads canonical privileges roles and role summaries", () => {
  const page = read("src/app/home/admin/privileges/page.tsx");
  for (const value of [
    /resolveAdministrator/,
    /redirect/,
    /AdminPermissionDenied/,
    /listPrivileges\(\)/,
    /supportedRoles\(\)/,
    /listRoles\(\)/,
    /selectedRole=/,
    /roleSummaries=/,
  ])
    assert.match(page, value);
});
test("enterprise header and supported KPIs render without fabricated metrics", () => {
  const source = ui();
  for (const value of [
    "Privileges & Access Control",
    "Manage role permissions and review effective access across Radaba modules",
    "Refresh",
    "View audit history",
    "Save changes",
    "Total Roles",
    "Total Modules",
    "Enabled Permissions",
    "Users Affected",
    "Protected Privileges",
    "Pending Changes",
  ])
    assert.match(source, new RegExp(value));
  assert.doesNotMatch(source, /Privilege Exceptions|revision before|inherited count/);
});
test("role selector uses actual inventory and role summaries", () => {
  const source = ui();
  for (const value of [
    /roles\.map/,
    /selectedSummary/,
    /userCount/,
    /isAdministrator/,
    /System protected/,
    /Standard role/,
    /roleSummaries\.find/,
  ])
    assert.match(source, value);
});
test("effective access is direct strict-boolean route access only", () => {
  const source = ui();
  for (const value of [
    /Effective Access/,
    /record\.roleValues\[effectiveRole\] === true/,
    /text\(record\.path\)/,
    /no inheritance or\s+user-level overrides/i,
  ])
    assert.match(source, value);
  assert.doesNotMatch(source, /user override selector|inherited permission toggle/i);
});
test("search and filters cover proven privilege metadata", () => {
  const source = ui();
  for (const value of [
    /useSearchParams/,
    /page_name/,
    /privilege_id/,
    /category/,
    /parent/,
    /Apply Filters/,
    /Clear privilege filters/,
    /Assigned to a role/,
    /Protected only/,
  ])
    assert.match(source, value);
});
test("stored categories drive collapsible module groups", () => {
  const source = ui();
  for (const value of [
    /moduleName/,
    /<details/,
    /<summary/,
    /Privilege modules/,
    /assigned roles/,
    /group-open:rotate-180/,
  ])
    assert.match(source, value);
});
test("desktop matrix and mobile cards preserve accurate strict states", () => {
  const source = ui();
  for (const value of [
    /<table/,
    /scope="col"/,
    /overflow-x-auto/,
    /lg:hidden/,
    /PrivilegeCard/,
    /PrivilegeToggle/,
    /Not defined/,
    /Enabled/,
    /Disabled/,
    /=== true/,
  ])
    assert.match(source, value);
});
test("review dialog tracks exact role privilege state and supports reset", () => {
  const source = ui();
  for (const value of [
    /PendingChange/,
    /Confirm privilege change/,
    /pending\.record\.page_name/,
    /pending\.role/,
    /pending\.enabled/,
    /cancel=\{\(\) => setPending\(null\)\}/,
    /role="dialog"/,
    /aria-modal="true"/,
    /event\.key === "Escape"/,
    /cancelRef\.current/,
  ])
    assert.match(source, value);
});
test("save retains approved per-field PATCH and optimistic concurrency baseline", () => {
  const source = ui(),
    detail = read("src/app/api/admin/privileges/[privilegeId]/route.ts"),
    command = read("src/server/admin/admin-command-service.ts");
  assert.match(source, /method: "PATCH"/);
  assert.match(source, /previousValue/);
  assert.match(detail, /updatePrivilegeForRole/);
  assert.match(command, /record\.roleValues\[input\.role\] !== input\.previousValue/);
  assert.match(command, /The privilege changed\. Refresh and retry/);
});
test("administrator access remains visibly and server-side protected", () => {
  const source = ui(),
    command = read("src/server/admin/admin-command-service.ts");
  assert.match(source, /ADMIN_PATH = "\/privilege"/);
  assert.match(source, /final Super Admin grant remains protected/);
  assert.match(command, /Final administrator access cannot be removed/);
});
test("loading empty error and denied states remain safe", () => {
  const source = ui(),
    loading = read("src/app/home/admin/privileges/loading.tsx"),
    error = read("src/app/home/admin/error.tsx");
  assert.match(source, /No privileges configured/);
  assert.match(source, /No privileges match these filters/);
  assert.match(loading, /aria-busy="true"/);
  assert.match(loading, /motion-reduce:animate-none/);
  assert.match(error, /No data was changed/);
  assert.doesNotMatch(source + loading + error, /FirebaseError|databaseURL|stack trace/);
});
test("RTDB path field names and API lifecycle remain unchanged", () => {
  const source = ui(),
    repository = read("src/server/admin/firebase-admin-data-repository.ts"),
    list = read("src/app/api/admin/privileges/route.ts"),
    detail = read("src/app/api/admin/privileges/[privilegeId]/route.ts");
  assert.match(repository, /PRIVILEGE_PATH = "privilege"/);
  assert.match(repository, /\.child\(privilegeKey\)\.child\(role\)\.set\(enabled\)/);
  for (const field of ["category", "icon", "page_name", "parent", "path", "privilege_id"])
    assert.match(repository, new RegExp(field));
  assert.doesNotMatch(source, /Add Privilege|Delete Privilege|Rename Privilege/);
  assert.match(list, /export async function GET/);
  assert.match(detail, /export async function PATCH/);
  assert.doesNotMatch(list + detail, /export async function (POST|PUT|DELETE)/);
});
