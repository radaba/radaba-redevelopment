import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { canAdministrate } from "../../src/features/admin/admin-authorization.mjs";
import { AdminCommandPolicy } from "../../src/server/admin/admin-command-service.mjs";
import { canAccessAssignment } from "../../src/features/assignment/assignment-privilege.mjs";

function repositoryFixture(overrides = {}) {
  const users = {
    admin: { key: "admin", role: "super_admin", status: "Active" },
    user: { key: "user", role: "manager", status: "Active" },
  };
  const privileges = [
    { key: "admin-page", path: "/privilege", roleValues: { super_admin: true, manager: false } },
    { key: "assignment", path: "/assignment", roleValues: { super_admin: true, manager: false } },
  ];
  const writes = [];
  return {
    users,
    privileges,
    writes,
    async findUser(key) {
      return users[key] ?? null;
    },
    async findPrivilege(key) {
      return privileges.find((record) => record.key === key) ?? null;
    },
    async supportedRoles() {
      return ["manager", "super_admin"];
    },
    async countActiveAdministrators() {
      return Object.values(users).filter(
        (user) => user.role === "super_admin" && user.status === "Active",
      ).length;
    },
    async listPrivileges() {
      return privileges;
    },
    async updateUserRoleField(key, role) {
      writes.push({ method: "role", key, role });
      users[key].role = role;
    },
    async updateUserStatusField(key, status) {
      writes.push({ method: "status", key, status });
      users[key].status = status;
    },
    async updatePrivilegeRoleField(key, role, enabled) {
      writes.push({ method: "privilege", key, role, enabled });
      privileges.find((record) => record.key === key).roleValues[role] = enabled;
    },
    ...overrides,
  };
}

test("administrator is allowed only by verified role, status, and strict privilege", () => {
  const privilege = { a: { path: "/privilege", super_admin: true } };
  assert.equal(canAdministrate({ role: "super_admin", status: "Active", privilege }), true);
  assert.equal(canAdministrate({ role: "manager", status: "Active", privilege }), false);
  assert.equal(canAdministrate({ role: "super_admin", status: "Not Active", privilege }), false);
  assert.equal(canAdministrate({ role: "super_admin", status: "Active", privilege: null }), false);
});

test("valid role update changes only the role field", async () => {
  const repository = repositoryFixture();
  await new AdminCommandPolicy(repository).updateUserRole({
    targetUserKey: "user",
    role: "super_admin",
    previousRole: "manager",
  });
  assert.deepEqual(repository.writes, [{ method: "role", key: "user", role: "super_admin" }]);
});

test("role update rejects invalid role, missing user, stale role, and final-admin demotion", async () => {
  const policy = new AdminCommandPolicy(repositoryFixture());
  await assert.rejects(
    policy.updateUserRole({ targetUserKey: "user", role: "unknown", previousRole: "manager" }),
    (error) => error.code === "INVALID_VALUE",
  );
  await assert.rejects(
    policy.updateUserRole({ targetUserKey: "missing", role: "manager", previousRole: "manager" }),
    (error) => error.code === "NOT_FOUND",
  );
  await assert.rejects(
    policy.updateUserRole({
      targetUserKey: "user",
      role: "super_admin",
      previousRole: "field_team",
    }),
    (error) => error.code === "CONFLICT",
  );
  await assert.rejects(
    policy.updateUserRole({ targetUserKey: "admin", role: "manager", previousRole: "super_admin" }),
    (error) => error.code === "CONFLICT",
  );
});

test("status update changes only status and protects final administrator", async () => {
  const repository = repositoryFixture();
  const policy = new AdminCommandPolicy(repository);
  await policy.updateUserStatus({
    targetUserKey: "user",
    status: "Not Active",
    previousStatus: "Active",
  });
  assert.deepEqual(repository.writes, [{ method: "status", key: "user", status: "Not Active" }]);
  await assert.rejects(
    policy.updateUserStatus({
      targetUserKey: "admin",
      status: "Not Active",
      previousStatus: "Active",
    }),
    (error) => error.code === "CONFLICT",
  );
});

test("status update rejects invalid status and missing user", async () => {
  const policy = new AdminCommandPolicy(repositoryFixture());
  await assert.rejects(
    policy.updateUserStatus({
      targetUserKey: "user",
      status: "disabled",
      previousStatus: "Active",
    }),
    (error) => error.code === "INVALID_VALUE",
  );
  await assert.rejects(
    policy.updateUserStatus({
      targetUserKey: "missing",
      status: "Active",
      previousStatus: "Active",
    }),
    (error) => error.code === "NOT_FOUND",
  );
});

test("privilege update requires strict booleans, known fields, and existing records", async () => {
  const policy = new AdminCommandPolicy(repositoryFixture());
  await assert.rejects(
    policy.updatePrivilegeForRole({
      privilegeKey: "assignment",
      role: "manager",
      enabled: "true",
      previousValue: false,
    }),
    (error) => error.code === "MALFORMED",
  );
  await assert.rejects(
    policy.updatePrivilegeForRole({
      privilegeKey: "assignment",
      role: "unknown",
      enabled: true,
      previousValue: false,
    }),
    (error) => error.code === "INVALID_VALUE",
  );
  await assert.rejects(
    policy.updatePrivilegeForRole({
      privilegeKey: "missing",
      role: "manager",
      enabled: true,
      previousValue: false,
    }),
    (error) => error.code === "NOT_FOUND",
  );
});

test("privilege true and false update only selected role and affect Assignment access", async () => {
  const repository = repositoryFixture();
  const policy = new AdminCommandPolicy(repository);
  await policy.updatePrivilegeForRole({
    privilegeKey: "assignment",
    role: "manager",
    enabled: true,
    previousValue: false,
  });
  assert.equal(
    canAccessAssignment(
      repository.privileges.map((record) => ({ path: record.path, ...record.roleValues })),
      "manager",
    ),
    true,
  );
  await policy.updatePrivilegeForRole({
    privilegeKey: "assignment",
    role: "manager",
    enabled: false,
    previousValue: true,
  });
  assert.equal(
    canAccessAssignment(
      repository.privileges.map((record) => ({ path: record.path, ...record.roleValues })),
      "manager",
    ),
    false,
  );
  assert.deepEqual(
    repository.writes.map(({ method, role }) => ({ method, role })),
    [
      { method: "privilege", role: "manager" },
      { method: "privilege", role: "manager" },
    ],
  );
});

test("final administrator privilege removal is rejected", async () => {
  const policy = new AdminCommandPolicy(repositoryFixture());
  await assert.rejects(
    policy.updatePrivilegeForRole({
      privilegeKey: "admin-page",
      role: "super_admin",
      enabled: false,
      previousValue: true,
    }),
    (error) => error.code === "CONFLICT",
  );
});

test("API derives actor from session and ignores client-supplied administrator identity", async () => {
  const route = await readFile(
    new URL("../../src/app/api/admin/users/[userKey]/role/route.ts", import.meta.url),
    "utf8",
  );
  assert.ok(route.indexOf("resolveAdministrator()") < route.indexOf("request.json()"));
  assert.doesNotMatch(route, /body\.(actor|uid|administrator|adminRole)/);
});

test("repository writes only explicit child role, status, and privilege fields", async () => {
  const source = await readFile(
    new URL("../../src/server/admin/firebase-admin-data-repository.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /child\("role"\)\.set\(role\)/);
  assert.match(source, /child\("status"\)\.set\(status\)/);
  assert.match(source, /child\(role\)\.set\(enabled\)/);
  assert.doesNotMatch(source, /database\.ref\([^\n]+\)\.push\(|\.remove\(/);
});

test("desktop/mobile users, dialogs, privilege matrix, loading and error states exist", async () => {
  const users = await readFile(
    new URL("../../src/components/admin/admin-users-client.tsx", import.meta.url),
    "utf8",
  );
  const privileges = await readFile(
    new URL("../../src/components/admin/admin-privileges-client.tsx", import.meta.url),
    "utf8",
  );
  const loading = await readFile(
    new URL("../../src/app/home/admin/loading.tsx", import.meta.url),
    "utf8",
  );
  const error = await readFile(
    new URL("../../src/app/home/admin/error.tsx", import.meta.url),
    "utf8",
  );
  assert.match(users, /<table/);
  assert.match(users, /md:hidden/);
  assert.match(users, /role="dialog"/);
  assert.match(privileges, /strict boolean/);
  assert.match(privileges, /aria-modal="true"/);
  assert.match(loading, /role="status"/);
  assert.match(error, /Try again/);
});

test("session resolver reads the confirmed privilege push-key collection", async () => {
  const source = await readFile(
    new URL("../../src/services/authentication/auth.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /ref\("privilege"\)\.once\("value"\)/);
  assert.doesNotMatch(source, /ref\("privilege"\)\.child\(role\)/);
});
