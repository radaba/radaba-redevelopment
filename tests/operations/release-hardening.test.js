import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { validateEnvironment } from "../../src/server/environment/contract.mjs";
import { previousRelease } from "../../scripts/release-state.mjs";
import { scanText } from "../../scripts/scan-secrets.mjs";

const base = {
  RADABA_ENV: "development",
  APP_URL: "https://development.example.invalid",
  APP_VERSION: "1.2.3",
  BUILD_ID: "fixture-build",
  NEXT_PUBLIC_FIREBASE_API_KEY: "fixture",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "development.example.invalid",
  NEXT_PUBLIC_FIREBASE_DATABASE_URL: "https://development.example.invalid",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "radaba-development",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "radaba-development.appspot.com",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "000000000000",
  NEXT_PUBLIC_FIREBASE_APP_ID: "fixture",
  FIREBASE_ADMIN_PROJECT_ID: "radaba-development",
};

test("environment validation accepts a complete development identity", () => {
  const result = validateEnvironment(base);
  assert.equal(result.ok, true);
  assert.match(result.fingerprint, /^[a-f0-9]{12}$/);
});

test("missing required environment fails safely", () => {
  const result = validateEnvironment({ ...base, BUILD_ID: "" });
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("BUILD_ID is required"));
});

test("development cannot target a production-named Firebase project", () => {
  const result = validateEnvironment({
    ...base,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: "radaba-production",
    FIREBASE_ADMIN_PROJECT_ID: "radaba-production",
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((value) => value.includes("production Firebase")));
});

test("Admin and client Firebase projects must match", () => {
  const result = validateEnvironment({
    ...base, FIREBASE_ADMIN_PROJECT_ID: "different-development",
  });
  assert.equal(result.ok, false);
});

test("health response source exposes release identity but no Firebase details", () => {
  const source = readFileSync("src/app/api/health/route.ts", "utf8");
  for (const field of ["status", "version", "buildId", "environment"]) {
    assert.match(source, new RegExp(field));
  }
  assert.doesNotMatch(source, /DATABASE_URL|PROJECT_ID|STORAGE_BUCKET|PRIVATE_KEY/);
});

test("secret scanner detects a safely constructed private key fixture", () => {
  const fixture = ["-----BEGIN ", "PRIVATE KEY-----", "fixture", "-----END PRIVATE KEY-----"].join("");
  assert.deepEqual(scanText(fixture), ["private_key"]);
  assert.deepEqual(scanText("ordinary release metadata"), []);
});

test("rollback selects the previous healthy immutable release", () => {
  const state = { releases: [
    { version: "v1.0.0", commit: "a".repeat(40), status: "healthy" },
    { version: "v1.1.0", commit: "b".repeat(40), status: "healthy" },
  ] };
  assert.equal(previousRelease(state, "v1.1.0").version, "v1.0.0");
  assert.throws(() => previousRelease(state, "v1.0.0"), /No previous/);
});

test("deployment workflows retain approval and branch gates", () => {
  const staging = readFileSync(".github/workflows/staging-deploy.yml", "utf8");
  const production = readFileSync(".github/workflows/production-deploy.yml", "utf8");
  assert.match(staging, /environment:\s*staging/);
  assert.match(production, /environment:\s*production/);
  assert.match(production, /refs\/heads\/main|refs\/tags\/v/);
  assert.match(production, /backup-release/);
  assert.match(production, /smoke-test/);
});
