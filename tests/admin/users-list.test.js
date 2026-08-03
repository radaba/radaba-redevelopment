import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildAdminUserList, parseAdminUserListParams } from "../../src/features/admin/admin-user-list.mjs";

const users = [
  { key: "c", uid: "uid-c", name: "Alex", email: "alex.c@example.com", role: "manager", status: "Active", company: "Beta", region: "East" },
  { key: "a", uid: "uid-a", name: "Alex", email: "alex.a@example.com", role: "field_team", status: "Not Active", company: "Alpha", region: "West" },
  { key: "b", uid: "uid-b", name: "Budi", email: "budi@example.com", role: "manager", status: "Active", company: "Alpha", region: "East" },
];

test("user list parameters are bounded and invalid values use defaults", () => {
  assert.deepEqual(parseAdminUserListParams({ page: "-2", pageSize: "999", sort: "unknown", direction: "sideways" }), {
    query: "", role: "", status: "", company: "", region: "", sort: "name", direction: "asc", page: 1, pageSize: 25,
  });
  assert.equal(parseAdminUserListParams({ q: "x".repeat(120) }).query.length, 100);
});

test("keyword search covers existing read-only user fields", () => {
  assert.deepEqual(buildAdminUserList(users, { q: "UID-B" }).users.map((user) => user.key), ["b"]);
  assert.equal(buildAdminUserList(users, { q: "alpha" }).filteredCount, 2);
});

test("exact filters combine without changing legacy values", () => {
  const result = buildAdminUserList(users, { role: "manager", status: "Active", region: "East" });
  assert.deepEqual(result.users.map((user) => user.key), ["c", "b"]);
});

test("sorting is deterministic and uses the push key as tie-breaker", () => {
  assert.deepEqual(buildAdminUserList(users).users.map((user) => user.key), ["a", "c", "b"]);
  assert.deepEqual(buildAdminUserList(users, { sort: "name", direction: "desc" }).users.map((user) => user.key), ["b", "a", "c"]);
});

test("page slicing clamps out-of-range pages and reports a truthful range", () => {
  const many = Array.from({ length: 52 }, (_, index) => ({ ...users[0], key: String(index).padStart(2, "0"), name: `User ${String(index).padStart(2, "0")}` }));
  const result = buildAdminUserList(many, { page: "9", pageSize: "25" });
  assert.equal(result.params.page, 3); assert.equal(result.pageCount, 3); assert.equal(result.users.length, 2);
  assert.equal(result.rangeStart, 51); assert.equal(result.rangeEnd, 52);
});

test("Users route remains authorized and performs one user and one privilege read", async () => {
  const page = await readFile(new URL("../../src/app/home/admin/users/page.tsx", import.meta.url), "utf8");
  assert.ok(page.indexOf("resolveAdministrator()") < page.indexOf("repository.listUsers()"));
  assert.match(page, /repository\.listUsers\(\), repository\.listPrivileges\(\)/);
  assert.doesNotMatch(page, /repository\.supportedRoles\(\)/);
});

test("Users UI exposes GET filters, sorting, pagination, and responsive results", async () => {
  const client = await readFile(new URL("../../src/components/admin/admin-users-client.tsx", import.meta.url), "utf8");
  assert.match(client, /method="get"\s+action="\/home\/admin\/users"/);
  assert.match(client, /name="q"/); assert.match(client, /name="role"/); assert.match(client, /name="status"/);
  assert.match(client, /name="company"/); assert.match(client, /name="region"/); assert.match(client, /name="sort"/);
  assert.match(client, /aria-label="Users pagination"/); assert.match(client, /md:hidden/); assert.match(client, /<table/);
});
