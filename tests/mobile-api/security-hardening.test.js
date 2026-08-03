import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createMobileSecurityAudit } from "../../src/server/mobile-api/security/audit.mjs";
import { resolveMobileSecurityMode } from "../../src/server/mobile-api/security/config.mjs";
import { validateMobileIdentifier } from "../../src/server/mobile-api/security/identifier.mjs";
import { MOBILE_ROUTE_POLICIES } from "../../src/server/mobile-api/security/policy.mjs";
import { createMobileSecurityService } from "../../src/server/mobile-api/security/service.mjs";
import { resolveMobileToken } from "../../src/server/mobile-api/security/token-resolver.mjs";
import { createSecureMobileHandler } from "../../src/server/mobile-api/security/wrapper.mjs";
import {
  securityAssignment,
  securityCell,
  securityProfiles,
} from "../fixtures/mobile-security-fixtures.js";

function request(url = "https://example.invalid/api/mobile/getassignmentsById", options = {}) {
  return new Request(url, options);
}

function setup(profile = securityProfiles.owner, options = {}) {
  const operations = [];
  const verifier = {
    async verify() {
      operations.push({ type: "verify", token: "[redacted]" });
      if (options.verifierError) throw options.verifierError;
      return options.claims ?? { uid: profile?.uid, email: profile?.email };
    },
  };
  const repository = {
    async findUsersByUid(uid) {
      operations.push({ type: "user", uid });
      if (options.userFailure) throw new Error("sensitive database path");
      return options.users ?? (profile ? [{ key: "user-key", value: profile }] : []);
    },
    async findUsersByEmail(email) {
      operations.push({ type: "user-email", email });
      return [];
    },
    async findAssignmentsById(id) {
      operations.push({ type: "assignment", id });
      return options.assignments ?? [{ key: "assignment-key", value: securityAssignment }];
    },
    async findCellsByRcellId(id) {
      operations.push({ type: "cell", id });
      return options.cells ?? [{ key: "cell-key", value: securityCell }];
    },
  };
  return {
    operations,
    service: createMobileSecurityService({ verifier, repository }),
  };
}

const bearer = { authorization: "Bearer token-valid-sample" };

test("security mode defaults safely and accepts only three exact values", () => {
  assert.equal(resolveMobileSecurityMode({}), "legacy-compatible");
  for (const mode of ["legacy-compatible", "observe", "enforce"]) {
    assert.equal(resolveMobileSecurityMode({ MOBILE_API_SECURITY_MODE: mode }), mode);
  }
  assert.throws(() => resolveMobileSecurityMode({ MOBILE_API_SECURITY_MODE: "ENFORCE" }), /Invalid/);
});

test("production enforcement is impossible in M11R", () => {
  assert.throws(() => resolveMobileSecurityMode({
    NODE_ENV: "production",
    MOBILE_API_SECURITY_MODE: "enforce",
  }), /not approved/);
  assert.equal(resolveMobileSecurityMode({
    NODE_ENV: "production",
    MOBILE_API_SECURITY_MODE: "observe",
  }), "observe");
});

test("client input cannot override centrally injected mode", async () => {
  const { service } = setup();
  const handler = createSecureMobileHandler(
    async () => new Response("legacy"),
    "getassignmentsById",
    { service, mode: "enforce" },
  );
  const response = await handler(request(
    "https://example.invalid/api/mobile/getassignmentsById?assignment_id=ASG-SECURITY-SAMPLE-001&security_mode=legacy-compatible",
  ));
  assert.equal(response.status, 401);
});

test("token resolver uses Bearer before cookie and ignores unsupported locations", () => {
  let result = resolveMobileToken(request("https://example.invalid", {
    headers: {
      authorization: "Bearer token-header-sample",
      cookie: "__session=token-cookie-sample",
    },
  }));
  assert.deepEqual(result, {
    ok: true, source: "authorization", token: "token-header-sample",
  });
  result = resolveMobileToken(request(
    "https://example.invalid?token=token-query-sample",
  ));
  assert.equal(result.reason, "missing_token");
});

test("token resolver distinguishes malformed and cookie credentials", () => {
  assert.equal(resolveMobileToken(request("https://example.invalid", {
    headers: { authorization: "Basic value" },
  })).reason, "malformed_token");
  assert.deepEqual(resolveMobileToken(request("https://example.invalid", {
    headers: { cookie: "other=x; __session=token-cookie-sample" },
  })), { ok: true, source: "cookie", token: "token-cookie-sample" });
});

test("verification errors distinguish expired, revoked, malformed, and invalid", async () => {
  for (const [code, reason] of [
    ["auth/id-token-expired", "expired_token"],
    ["auth/id-token-revoked", "revoked_token"],
    ["auth/argument-error", "malformed_token"],
    ["auth/internal-error", "invalid_token"],
  ]) {
    const error = Object.assign(new Error("secret verifier detail"), { code });
    const { service } = setup(securityProfiles.owner, { verifierError: error });
    const decision = await service.evaluate(
      MOBILE_ROUTE_POLICIES.getassignmentsById,
      { ok: true, token: "token-valid-sample" },
      { query: { assignment_id: securityAssignment.assignment_id }, body: {} },
    );
    assert.equal(decision.reason, reason);
    assert.equal(JSON.stringify(decision).includes("secret"), false);
  }
});

test("active owner is authorized for own Assignment", async () => {
  const { service } = setup();
  const decision = await service.evaluate(
    MOBILE_ROUTE_POLICIES.getassignmentsById,
    { ok: true, token: "token-valid-sample" },
    { query: { assignment_id: securityAssignment.assignment_id }, body: {} },
  );
  assert.equal(decision.allowed, true);
  assert.equal(decision.reason, "assignment_owner");
});

test("inactive, disabled, missing, duplicate, and unknown-role profiles are denied", async () => {
  const cases = [
    [securityProfiles.inactive, {}, "inactive_user"],
    [securityProfiles.disabled, {}, "disabled_user"],
    [securityProfiles.owner, { users: [] }, "unknown_user"],
    [securityProfiles.owner, { users: [
      { key: "a", value: securityProfiles.owner },
      { key: "b", value: securityProfiles.owner },
    ] }, "duplicate_user"],
    [securityProfiles.unknownRole, {}, "role_mismatch"],
  ];
  for (const [profile, options, reason] of cases) {
    const { service } = setup(profile, options);
    const decision = await service.evaluate(
      MOBILE_ROUTE_POLICIES.getassignmentsById,
      { ok: true, token: "token-valid-sample" },
      { query: { assignment_id: securityAssignment.assignment_id }, body: {} },
    );
    assert.equal(decision.reason, reason);
  }
});

test("non-owner and unrelated coordinator are denied", async () => {
  for (const profile of [securityProfiles.other, securityProfiles.unrelatedCoordinator]) {
    const { service } = setup(profile);
    const decision = await service.evaluate(
      MOBILE_ROUTE_POLICIES.getassignmentsById,
      { ok: true, token: "token-valid-sample" },
      { query: { assignment_id: securityAssignment.assignment_id }, body: {} },
    );
    assert.equal(decision.reason, "ownership_mismatch");
  }
});

test("related coordinator and explicit Administrator are authorized", async () => {
  for (const profile of [securityProfiles.coordinator, securityProfiles.administrator]) {
    const { service } = setup(profile);
    const decision = await service.evaluate(
      MOBILE_ROUTE_POLICIES.getassignmentsById,
      { ok: true, token: "token-valid-sample" },
      { query: { assignment_id: securityAssignment.assignment_id }, body: {} },
    );
    assert.equal(decision.allowed, true);
  }
});

test("missing and duplicate Assignments hide or deny object access", async () => {
  for (const [assignments, reason] of [
    [[], "object_not_found"],
    [[{ key: "a", value: securityAssignment }, { key: "b", value: securityAssignment }], "duplicate_assignment"],
  ]) {
    const { service } = setup(securityProfiles.owner, { assignments });
    const decision = await service.evaluate(
      MOBILE_ROUTE_POLICIES.getassignmentsById,
      { ok: true, token: "token-valid-sample" },
      { query: { assignment_id: securityAssignment.assignment_id }, body: {} },
    );
    assert.equal(decision.reason, reason);
  }
});

test("request rigger identity spoofing is rejected", async () => {
  const { service } = setup();
  const decision = await service.evaluate(
    MOBILE_ROUTE_POLICIES.updateAssignmentDetails,
    { ok: true, token: "token-valid-sample" },
    { query: {}, body: {
      assignment_id: securityAssignment.assignment_id,
      rigger_email: "other@example.invalid",
    } },
  );
  assert.equal(decision.reason, "identity_spoofing");
});

test("profile updates allow self and explicit Administrator only", async () => {
  for (const [profile, email, allowed] of [
    [securityProfiles.owner, securityProfiles.owner.email, true],
    [securityProfiles.owner, securityProfiles.other.email, false],
    [securityProfiles.administrator, securityProfiles.other.email, true],
  ]) {
    const { service } = setup(profile);
    const decision = await service.evaluate(
      MOBILE_ROUTE_POLICIES.updateUserDetails,
      { ok: true, token: "token-valid-sample" },
      { query: { email }, body: {} },
    );
    assert.equal(decision.allowed, allowed);
  }
});

test("Cell read derives and enforces the parent Assignment", async () => {
  const { service } = setup();
  const decision = await service.evaluate(
    MOBILE_ROUTE_POLICIES.getCellDetailsPerSector,
    { ok: true, token: "token-valid-sample" },
    { query: { rcell_id: securityCell.rcell_id }, body: {} },
  );
  assert.equal(decision.allowed, true);
  assert.equal(decision.objectId, securityCell.rcell_id);
});

test("missing and cross-Assignment Cell relationships are rejected", async () => {
  const missing = setup(securityProfiles.owner, { cells: [] });
  let decision = await missing.service.evaluate(
    MOBILE_ROUTE_POLICIES.getCellDetailsPerSector,
    { ok: true, token: "token-valid-sample" },
    { query: { rcell_id: securityCell.rcell_id }, body: {} },
  );
  assert.equal(decision.reason, "object_not_found");
  const crossed = setup(securityProfiles.owner, { cells: [{
    key: "cell-key",
    value: { ...securityCell, assignment_id: "ASG-OTHER-SAMPLE" },
  }] });
  decision = await crossed.service.evaluate(
    MOBILE_ROUTE_POLICIES.updateCellDetails,
    { ok: true, token: "token-valid-sample" },
    { query: {}, body: {
      assignment_id: securityAssignment.assignment_id,
      rcell_id: securityCell.rcell_id,
    } },
  );
  assert.equal(decision.reason, "cross_object_access");
});

test("new Cell requires rcell_id suffix relationship to Assignment", async () => {
  const { service } = setup(securityProfiles.owner, { cells: [] });
  for (const [rcellId, allowed] of [
    [securityCell.rcell_id, true],
    ["sector_1_l1800_ASG-OTHER-SAMPLE", false],
  ]) {
    const decision = await service.evaluate(
      MOBILE_ROUTE_POLICIES.updateCellDetails,
      { ok: true, token: "token-valid-sample" },
      { query: {}, body: {
        assignment_id: securityAssignment.assignment_id,
        rcell_id: rcellId,
      } },
    );
    assert.equal(decision.allowed, allowed);
  }
});

test("image metadata policy is authorized through its parent Assignment", async () => {
  const { service } = setup();
  const decision = await service.evaluate(
    MOBILE_ROUTE_POLICIES.updateImageDetails,
    { ok: true, token: "token-valid-sample" },
    { query: {}, body: { assignment_id: securityAssignment.assignment_id } },
  );
  assert.equal(decision.allowed, true);
});

test("identifier validation rejects RTDB injection, whitespace, controls, traversal, and empty", () => {
  for (const value of [
    "", " ASG-SAMPLE", "ASG-SAMPLE ", "ASG/CHILD", "ASG#KEY",
    "ASG.KEY", "ASG$KEY", "ASG[KEY]", "ASG..KEY", "ASG\u0000KEY",
  ]) assert.equal(validateMobileIdentifier(value).valid, false, value);
  for (const value of ["ASG-001", "001", "งาน-001"]) {
    assert.deepEqual(validateMobileIdentifier(value), { valid: true, value });
  }
});

test("legacy-compatible mode permits violations without audit output", async () => {
  const logs = [];
  const { service } = setup();
  const handler = createSecureMobileHandler(
    async () => new Response("legacy", { status: 200 }),
    "getassignmentsById",
    {
      service,
      mode: "legacy-compatible",
      audit: { record: (entry) => logs.push(entry) },
    },
  );
  const response = await handler(request(
    `https://example.invalid/api/mobile/getassignmentsById?assignment_id=${securityAssignment.assignment_id}`,
  ));
  assert.equal(await response.text(), "legacy");
  assert.equal(logs.length, 0);
});

test("observe mode records sanitized violation and permits legacy response", async () => {
  const logs = [];
  const { service } = setup();
  const handler = createSecureMobileHandler(
    async () => new Response("legacy"),
    "getassignmentsById",
    { service, mode: "observe", audit: { record: (entry) => logs.push(entry) } },
  );
  const response = await handler(request(
    `https://example.invalid/api/mobile/getassignmentsById?assignment_id=${securityAssignment.assignment_id}`,
  ));
  assert.equal(await response.text(), "legacy");
  assert.equal(logs[0].reason, "missing_token");
  assert.equal(JSON.stringify(logs).includes("token"), true);
  assert.equal(JSON.stringify(logs).includes("token-valid-sample"), false);
});

test("enforce mode maps missing token, ownership, unsafe ID, and hidden object", async () => {
  const cases = [
    [setup().service, {}, securityAssignment.assignment_id, 401],
    [setup(securityProfiles.other).service, bearer, securityAssignment.assignment_id, 403],
    [setup().service, bearer, "ASG/BAD", 400],
    [setup(securityProfiles.owner, { assignments: [] }).service, bearer, securityAssignment.assignment_id, 404],
  ];
  for (const [service, headers, id, status] of cases) {
    const handler = createSecureMobileHandler(
      async () => new Response("legacy"),
      "getassignmentsById",
      { service, mode: "enforce" },
    );
    const response = await handler(request(
      `https://example.invalid/api/mobile/getassignmentsById?assignment_id=${encodeURIComponent(id)}`,
      { headers },
    ));
    assert.equal(response.status, status);
    assert.deepEqual(Object.keys(await response.json()), ["code", "message", "data"]);
  }
});

test("enforce mode sanitizes security infrastructure and downstream 500 errors", async () => {
  for (const [service, downstream] of [
    [setup(securityProfiles.owner, { userFailure: true }).service, 200],
    [setup().service, 500],
  ]) {
    const handler = createSecureMobileHandler(
      async () => new Response(JSON.stringify({ data: "sensitive Firebase path" }), {
        status: downstream,
      }),
      "getassignmentsById",
      { service, mode: "enforce" },
    );
    const response = await handler(request(
      `https://example.invalid/api/mobile/getassignmentsById?assignment_id=${securityAssignment.assignment_id}`,
      { headers: bearer },
    ));
    assert.equal(response.status, 500);
    assert.equal((await response.json()).data, "Internal mobile API error");
  }
});

test("safe audit output hashes identities and excludes headers, bodies, and tokens", () => {
  const entries = [];
  const logger = { info: (...values) => entries.push(values) };
  createMobileSecurityAudit(
    logger,
    () => new Date("2026-07-27T00:00:00.000Z"),
    () => "request-sample",
  ).record({
    route: "updateAssignmentDetails",
    method: "PUT",
    mode: "observe",
    allowed: false,
    reason: "ownership_mismatch",
    uid: securityProfiles.owner.uid,
    objectType: "assignment",
    objectId: securityAssignment.assignment_id,
  });
  const text = JSON.stringify(entries);
  assert.equal(text.includes(securityProfiles.owner.uid), false);
  assert.equal(text.includes(securityAssignment.assignment_id), false);
  assert.equal(text.includes("authorization"), false);
  assert.equal(entries[0][1].actor.length, 12);
});

test("audit logger failure never changes request evaluation", () => {
  assert.doesNotThrow(() => createMobileSecurityAudit({
    info() { throw new Error("logger unavailable"); },
  }).record({ route: "x", method: "GET", mode: "observe", allowed: false }));
});

test("every implemented mobile route has an explicit policy", () => {
  const routeRoot = path.join(process.cwd(), "src/app/api/mobile");
  const routes = fs.readdirSync(routeRoot).filter((name) =>
    fs.existsSync(path.join(routeRoot, name, "route.ts")));
  assert.equal(routes.length, 15);
  assert.deepEqual(routes.filter((route) => !MOBILE_ROUTE_POLICIES[route]), []);
});

test("every protected route is wired through the central runtime wrapper", () => {
  for (const [route, policy] of Object.entries(MOBILE_ROUTE_POLICIES)) {
    if (policy.access === "public" || route === "signout") continue;
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/app/api/mobile", route, "route.ts"),
      "utf8",
    );
    assert.match(source, /secureMobileHandler/);
    assert.match(source, new RegExp(`["']${route}["']`));
  }
});

test("Firebase verifier enables revocation checking and no test imports runtime Firebase", () => {
  const verifier = fs.readFileSync(
    path.join(process.cwd(), "src/server/mobile-api/security/firebase-mobile-token-verifier.ts"),
    "utf8",
  );
  assert.match(verifier, /verifyIdToken\(token, true\)/);
  assert.doesNotMatch(
    fs.readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(0, 17).join("\n"),
    /firebase-mobile-token-verifier|firebase-mobile-security-repository/,
  );
});

test("security fixtures and implementation contain no credential-shaped data", () => {
  const files = [
    "tests/fixtures/mobile-security-fixtures.js",
    "src/server/mobile-api/security/service.mjs",
    "src/server/mobile-api/security/wrapper.mjs",
  ].map((file) => fs.readFileSync(path.join(process.cwd(), file), "utf8")).join("\n");
  assert.match(files, /example[.]invalid/);
  assert.doesNotMatch(
    files,
    /PRIVATE KEY|AIza[A-Za-z0-9_-]{20,}|Bearer [A-Za-z0-9._-]{20,}|firebaseio[.]com|password["']?\s*:/i,
  );
});
