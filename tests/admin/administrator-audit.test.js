import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  createAdministratorAuditRecord,
  prepareAdministratorAudit,
  recordAdministratorAudit,
  sanitizeAdministratorAuditSnapshot,
} from "../../src/features/admin/administrator-audit-contract.mjs";
const input = {
  administratorIdentifier: "admin-1",
  administratorEmail: "admin@example.com",
  action: "user.role.changed",
  resourceType: "user",
  resourceIdentifier: "user-key",
  summary: "Changed user role.",
  before: { role: "manager" },
  after: { role: "super_admin" },
  requestIdentifier: "request-1",
  ipAddress: "127.0.0.1",
  userAgent: "test-agent",
};
test("audit record creation includes generated identity, timestamp, actor, resource, snapshots, and request context", () => {
  const prepared = prepareAdministratorAudit(input),
    record = createAdministratorAuditRecord("audit-key", "2026-07-25T00:00:00.000Z", prepared);
  assert.deepEqual(record, {
    auditId: "audit-key",
    timestamp: "2026-07-25T00:00:00.000Z",
    ...input,
  });
});
test("safe snapshot filtering removes sensitive keys recursively", () => {
  const safe = sanitizeAdministratorAuditSnapshot({
    role: "manager",
    password: "hidden",
    nested: { token: "hidden", status: "Active", customClaims: { admin: true } },
    session_cookie: "hidden",
    items: [{ privateKey: "hidden", name: "safe" }],
  });
  assert.deepEqual(safe, {
    role: "manager",
    nested: { status: "Active" },
    items: [{ name: "safe" }],
  });
});
test("generic recorder appends one prepared audit record", async () => {
  const appended = [];
  const result = await recordAdministratorAudit(
    {
      append: async (value) => {
        appended.push(value);
        return createAdministratorAuditRecord("key", "time", value);
      },
    },
    input,
  );
  assert.deepEqual(result, { recorded: true });
  assert.equal(appended.length, 1);
  assert.deepEqual(appended[0].before, { role: "manager" });
  assert.deepEqual(appended[0].after, { role: "super_admin" });
});
test("audit failure is best effort and logs sanitized internal context", async () => {
  const logs = [];
  const result = await recordAdministratorAudit(
    {
      append: async () => {
        throw new Error("credential secret");
      },
    },
    input,
    (message, context) => logs.push({ message, context }),
  );
  assert.deepEqual(result, { recorded: false });
  assert.equal(logs.length, 1);
  assert.equal(logs[0].message, "Administrator audit recording failed");
  assert.doesNotMatch(JSON.stringify(logs), /credential secret/);
});
test("Firebase audit repository is append-only under the dedicated collection", async () => {
  const source = await readFile(
    new URL("../../src/server/admin/firebase-administrator-audit-repository.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /AUDIT_PATH="administrator_audit"/);
  assert.match(source, /ref\(AUDIT_PATH\)\.push\(\)/);
  assert.match(source, /reference\.set\(record\)/);
  assert.doesNotMatch(source, /\.update\(|\.remove\(|\.child\(auditId\)/);
});
test("role and status changes audit safe before and after fields after authoritative writes", async () => {
  const service = await readFile(
    new URL("../../src/server/admin/admin-command-service.ts", import.meta.url),
    "utf8",
  );
  assert.ok(service.indexOf("updateUserRoleField") < service.indexOf('"user.role.changed"'));
  assert.ok(service.indexOf("updateUserStatusField") < service.indexOf('"user.status.changed"'));
  assert.match(service, /\{\s*role:\s*target\.role\s*\},\s*\{\s*role:\s*input\.role\s*\}/);
  assert.match(service, /\{\s*status:\s*target\.status\s*\},\s*\{\s*status:\s*input\.status\s*\}/);
  assert.doesNotMatch(service, /updatePrivilegeForRole[\s\S]*privilege\.[\w]+\.changed/);
});
test("role and status routes derive audit actor and request context server-side", async () => {
  for (const routePath of ["role", "status"]) {
    const source = await readFile(
      new URL(`../../src/app/api/admin/users/[userKey]/${routePath}/route.ts`, import.meta.url),
      "utf8",
    );
    assert.ok(
      source.indexOf("resolveAdministrator()") <
        source.indexOf("administratorAuditRequestContext(request)"),
    );
    assert.match(source, /actorEmail: actor\.email/);
    assert.match(source, /FirebaseAdministratorAuditRepository/);
  }
});
