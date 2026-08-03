import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import * as requestAdapter from "../../src/server/mobile-api/compatibility/request.mjs";
import * as responseAdapter from "../../src/server/mobile-api/compatibility/response.mjs";
import * as timestamps from "../../src/server/mobile-api/compatibility/timestamps.mjs";
import {
  createFirebaseMobileAuthAdapter,
  createMobileAuthenticationAdapter,
} from "../../src/server/mobile-api/authentication/adapter.mjs";
import { mobileAuthorizationPolicies } from "../../src/server/mobile-api/authorization/policies.mjs";
import {
  MOBILE_RTDB_PATHS,
  assertMobileCellRepository,
  mobileRepositoryOperations,
} from "../../src/server/mobile-api/repositories/mobile-repositories.mjs";
import {
  createFakeMobileAuth,
  createFakeMobileCellRepository,
} from "../../src/server/mobile-api/testing/fakes.mjs";
import { compareMobileCompatibility } from "../../src/server/mobile-api/testing/shadow-compare.mjs";
import { createGetCellDetailsHandler } from "../../src/server/mobile-api/routes/get-cell-details.mjs";
import { createGetCurrentTimeHandler } from "../../src/server/mobile-api/routes/get-current-time.mjs";
import {
  getRejectDropReasonList,
  REJECT_DROP_REASONS,
} from "../../src/server/mobile-api/routes/get-reject-drop-reason-list.mjs";
import {
  legacyCellSuccessFixture,
  mobileCellFixture,
} from "../fixtures/mobile-api-fixtures.js";

function mobileRequest(url, options = {}) {
  return {
    nextUrl: new URL(url),
    json: options.json ?? (async () => options.body),
  };
}

const jsonBody = (response) => response.json();

test("query adapter preserves scalar and empty query values", () => {
  assert.deepEqual(
    requestAdapter.readLegacyQuery(mobileRequest("https://example.invalid/api?a=0&empty=")),
    { a: "0", empty: "" },
  );
});

test("query adapter preserves repeated query values as arrays", () => {
  assert.deepEqual(
    requestAdapter.readLegacyQuery(mobileRequest("https://example.invalid/api?a=1&a=2")),
    { a: ["1", "2"] },
  );
});

test("JSON adapter preserves unknown, null, zero, false, and empty values", async () => {
  const value = { unknown: "kept", nil: null, zero: 0, disabled: false, empty: "" };
  assert.deepEqual(
    await requestAdapter.readLegacyJsonBody(
      mobileRequest("https://example.invalid", { body: value }),
    ),
    { ok: true, value },
  );
});

test("JSON adapter reports malformed JSON without choosing a response", async () => {
  const error = new SyntaxError("malformed");
  const result = await requestAdapter.readLegacyJsonBody(
    mobileRequest("https://example.invalid", {
      json: async () => {
        throw error;
      },
    }),
  );
  assert.equal(result.ok, false);
  assert.equal(result.error, error);
});

test("legacy input supports body and query precedence", () => {
  assert.equal(
    requestAdapter.getLegacyInput({ value: "query" }, { value: "body" }, "value"),
    "body",
  );
  assert.equal(
    requestAdapter.getLegacyInput(
      { value: "query" },
      { value: "body" },
      "value",
      { precedence: "query" },
    ),
    "query",
  );
});

for (const value of ["", null, 0, false, "12"]) {
  test(`legacy value helpers preserve ${JSON.stringify(value)}`, () => {
    assert.equal(requestAdapter.preserveLegacyValue(value, "fallback"), value);
    assert.equal(requestAdapter.getLegacyNumberLike(value), value);
    assert.equal(requestAdapter.getLegacyBooleanLike(value), value);
  });
}

test("legacy string normalization is opt-in", () => {
  assert.equal(requestAdapter.getLegacyString(" Value "), " Value ");
  assert.equal(
    requestAdapter.getLegacyString(" Value ", { trim: true, case: "lower" }),
    "value",
  );
});

test("response adapter supports raw string, array, object, and null", async () => {
  assert.equal(await responseAdapter.legacyText("legacy", 201).text(), "legacy");
  assert.deepEqual(await jsonBody(responseAdapter.legacyJson(["a"])), ["a"]);
  assert.deepEqual(await jsonBody(responseAdapter.legacyJson({ value: 1 })), { value: 1 });
  assert.equal(await jsonBody(responseAdapter.legacyJson(null)), null);
});

test("legacy envelope preserves exact property order", () => {
  assert.equal(
    JSON.stringify(responseAdapter.legacyEnvelope(200, "success", {})),
    '{"code":200,"message":"success","data":{}}',
  );
});

test("legacy failure supports HTTP-200 error output", async () => {
  const response = responseAdapter.legacyFailure(
    200,
    "success",
    "The assignment not found",
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await jsonBody(response), {
    code: 200,
    message: "success",
    data: "The assignment not found",
  });
});

test("Jakarta date and datetime formatting are exact", () => {
  const value = new Date("2026-01-01T18:02:03.000Z");
  assert.equal(timestamps.formatLegacyJakartaDate(value), "2026-01-02");
  assert.equal(timestamps.formatLegacyJakartaDatetime(value), "2026-01-02 01:02:03");
});

test("Jakarta clock is deterministic through injection", () => {
  const clock = timestamps.createLegacyJakartaClock(
    () => new Date("2026-01-01T18:02:03.000Z"),
  );
  assert.deepEqual(clock.current(), {
    currDatetime: "2026-01-02 01:02:03",
    currDate: "2026-01-02",
  });
});

test("RTDB path contract preserves exact legacy names", () => {
  assert.equal(MOBILE_RTDB_PATHS.cell, "cell");
  assert.equal(MOBILE_RTDB_PATHS.assignment, "assignment");
  assert.equal(MOBILE_RTDB_PATHS.privilege, "privilege");
});

test("repository operations are operation-specific", () => {
  assert.deepEqual(mobileRepositoryOperations.cell, ["findByAssignmentId", "findByRcellId"]);
  assert.equal(mobileRepositoryOperations.loginLog[0], "writeLoginLog");
});

test("fake repository records exact Firebase query intent", async () => {
  const repository = createFakeMobileCellRepository({ records: [mobileCellFixture] });
  await repository.findByAssignmentId("ASG-SAMPLE-001");
  assert.deepEqual(repository.operations, [{
    type: "read",
    path: "cell",
    orderBy: "assignment_id",
    equalTo: "ASG-SAMPLE-001",
  }]);
});

test("fake repository supports failure injection", async () => {
  const repository = createFakeMobileCellRepository({ error: new Error("firebase failed") });
  await assert.rejects(() => repository.findByAssignmentId("ASG"), /firebase failed/);
  assert.throws(() => assertMobileCellRepository({}), /findByAssignmentId/);
});

test("Auth fake redacts credentials and tokens in operation logs", async () => {
  const auth = createFakeMobileAuth({ result: { idToken: "sanitized-result" } });
  await auth.signIn("rigger@example.invalid", "not-recorded");
  assert.equal(auth.operations[0].password, "[redacted]");
  assert.doesNotMatch(JSON.stringify(auth.operations), /not-recorded/);
});

test("authentication interface is mockable and not globally enforced", async () => {
  const adapter = createMobileAuthenticationAdapter({ signIn: async () => ({ ok: true }) });
  assert.deepEqual(await adapter.signIn(), { ok: true });
  await assert.rejects(() => adapter.verifyIdToken("token"), /not implemented/);
});

test("Firebase Auth adapter delegates without changing result shape", async () => {
  const calls = [];
  const adapter = createFirebaseMobileAuthAdapter({
    async signIn(email) {
      calls.push(email);
      return { token: "sanitized" };
    },
    async verifyIdToken() {},
    async getUser() {},
    async revokeRefreshTokens() {},
  });
  assert.deepEqual(await adapter.signIn("rigger@example.invalid", "x"), {
    token: "sanitized",
  });
  assert.deepEqual(calls, ["rigger@example.invalid"]);
});

test("authorization skeleton returns non-enforcing decisions", () => {
  assert.equal(mobileAuthorizationPolicies.authenticated(null).allowed, false);
  assert.equal(
    mobileAuthorizationPolicies.assignmentOwner(
      { email: "rigger@example.invalid" },
      { rigger_email: "rigger@example.invalid" },
    ).allowed,
    true,
  );
  assert.equal(
    mobileAuthorizationPolicies.role({ role: "Admin" }, ["Rigger"]).allowed,
    false,
  );
});

test("getRejectDropReasonList preserves the exact legacy fixture", async () => {
  const response = await getRejectDropReasonList();
  assert.equal(response.status, 200);
  assert.deepEqual(await jsonBody(response), {
    code: 200,
    message: "success",
    data: [...REJECT_DROP_REASONS],
  });
  assert.equal(REJECT_DROP_REASONS.length, 16);
  assert.equal(REJECT_DROP_REASONS[0], "Ada tim dan aktifitas lain di dalam site");
});

test("getCurrentTime returns exact deterministic fields", async () => {
  const handler = createGetCurrentTimeHandler({
    clock: timestamps.createLegacyJakartaClock(
      () => new Date("2026-01-01T18:02:03.000Z"),
    ),
  });
  assert.deepEqual(await jsonBody(await handler()), {
    code: 200,
    message: "success",
    data: { currDatetime: "2026-01-02 01:02:03", currDate: "2026-01-02" },
  });
});

test("getCellDetails preserves Android DTO field casing and values", async () => {
  const handler = createGetCellDetailsHandler(
    createFakeMobileCellRepository({ records: [mobileCellFixture] }),
  );
  const response = await handler(
    mobileRequest("https://example.invalid/api/mobile/getCellDetails?assignment_id=ASG-SAMPLE-001"),
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await jsonBody(response), legacyCellSuccessFixture);
});

test("getCellDetails preserves HTTP-200 empty array", async () => {
  const handler = createGetCellDetailsHandler(createFakeMobileCellRepository());
  const response = await handler(
    mobileRequest("https://example.invalid/api/mobile/getCellDetails?assignment_id=ASG-MISSING"),
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await jsonBody(response), { code: 200, message: "success", data: [] });
});

test("getCellDetails passes missing query as undefined", async () => {
  const repository = createFakeMobileCellRepository();
  await createGetCellDetailsHandler(repository)(
    mobileRequest("https://example.invalid/api/mobile/getCellDetails"),
  );
  assert.equal(repository.operations[0].equalTo, undefined);
});

test("getCellDetails preserves raw Firebase error message", async () => {
  const handler = createGetCellDetailsHandler(
    createFakeMobileCellRepository({ error: new Error("sanitized firebase failure") }),
  );
  const response = await handler(
    mobileRequest("https://example.invalid/api/mobile/getCellDetails?assignment_id=ASG"),
  );
  assert.equal(response.status, 500);
  assert.deepEqual(await jsonBody(response), {
    code: 500,
    message: "failed",
    data: "sanitized firebase failure",
  });
});

for (const routePath of [
  "src/app/api/mobile/getRejectDropReasonList/route.ts",
  "src/app/api/mobile/getCurrentTime/route.ts",
  "src/app/api/mobile/getCellDetails/route.ts",
]) {
  test(`${routePath} preserves legacy method fallthrough`, () => {
    const source = fs.readFileSync(path.resolve(routePath), "utf8");
    for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]) {
      assert.match(source, new RegExp(`export const ${method} =`));
    }
  });
}

test("shadow comparison detects exact matches and differences", () => {
  assert.deepEqual(
    compareMobileCompatibility(
      { status: 200, body: legacyCellSuccessFixture },
      { status: 200, body: structuredClone(legacyCellSuccessFixture) },
    ),
    { equal: true, differences: [] },
  );
  assert.deepEqual(
    compareMobileCompatibility(
      { status: 200, body: [] },
      { status: 500, body: { error: true } },
    ),
    { equal: false, differences: ["status", "body_type", "body"] },
  );
});

test("fixtures contain no secret-shaped data", () => {
  const serialized = JSON.stringify({ mobileCellFixture, legacyCellSuccessFixture });
  assert.doesNotMatch(serialized, /private_key|service_account|password|idToken|Bearer /i);
  assert.match(serialized, /example|SAMPLE/);
});

test("test fakes never import operational Firebase", () => {
  for (const file of fs.readdirSync(path.resolve("src/server/mobile-api/testing"))) {
    const source = fs.readFileSync(path.resolve("src/server/mobile-api/testing", file), "utf8");
    assert.doesNotMatch(source, /firebase-admin|firebase\/admin|service-account/);
  }
});
