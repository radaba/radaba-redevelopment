import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
const resolver = fs.readFileSync("src/server/profile/authenticated-profile-resolver.ts", "utf8"),
  repository = fs.readFileSync("src/server/profile/firebase-profile-repository.ts", "utf8"),
  service = fs.readFileSync("src/server/profile/profile-service.ts", "utf8"),
  photo = fs.readFileSync("src/server/profile/profile-photo-service.ts", "utf8"),
  route = fs.readFileSync("src/app/api/profile/route.ts", "utf8");
test("shared resolver uses exact stored UID and returns a distinct RTDB push key", () => {
  assert.match(resolver, /repository\.findByUid\(actor\.uid\)/);
  assert.match(resolver, /authUid:\s*actor\.uid/);
  assert.match(resolver, /userKey:\s*record\.key/);
  assert.doesNotMatch(resolver, /record\.key\s*[!=]==?\s*actor\.uid/);
});
test("duplicate UID no UID and corrupt legacy records have precise outcomes", () => {
  for (const code of [
    "duplicate_uid",
    "duplicate_email",
    "profile_not_found",
    "uid_missing_email_unique",
    "profile_identity_corrupt",
  ])
    assert.match(resolver, new RegExp(code));
  assert.match(resolver, /uidMatches\.length\s*>\s*1/);
  assert.match(resolver, /emailMatches\.length\s*>\s*1/);
});
test("missing UID uses unique verified-email compatibility without mutating identity", () => {
  assert.match(resolver, /verified_email_diagnostic/);
  assert.match(resolver, /lookupStrategy:\s*"verified_email_compatibility"/);
  assert.match(resolver, /compatibility:\s*true/);
  assert.match(resolver, /if\s*\(record\.uid\)[\s\S]*profile_identity_corrupt/);
  assert.doesNotMatch(resolver, /claimUid|update.*uid/i);
  assert.match(repository, /orderByChild\(field\)/);
});
test("UID and email pointing at different push keys is blocked", () => {
  assert.match(resolver, /emailMatches\[0\]\.key\s*!==\s*record\.key/);
  assert.match(resolver, /uid_email_cross_check/);
});
test("personal and photo actions share the same authenticated resolver", () => {
  assert.match(service, /resolveAuthenticatedProfile/);
  assert.match(photo, /resolveAuthenticatedProfile/);
  assert.match(service, /updateEditable\(userKey/);
  assert.match(photo, /updateUserPhoto\(resolved\.userKey/);
});
test("client identity cannot select a profile", () => {
  assert.doesNotMatch(route, /body\.(?:uid|authUid|userKey|userId|email)/);
  assert.doesNotMatch(service, /findByEmail\(.*body|findByUid\(.*body/);
  assert.match(service, /unauthorized_identity_override/);
});
test("development diagnostics are bounded and production-disabled", () => {
  assert.match(resolver, /process\.env\.NODE_ENV\s*===\s*"production"/);
  for (const field of [
    "authUidHash",
    "sessionEmailHash",
    "userKeyHash",
    "storedUidHash",
    "storedEmailHash",
    "lookupStrategy",
    "uidMatchCount",
    "emailMatchCount",
    "uidMatchingUserKeyHashes",
    "emailMatchingUserKeyHashes",
    "rtdbRoot",
    "storedUidField",
    "clientIdentityFields",
    "result",
  ])
    assert.match(resolver, new RegExp(field));
  assert.doesNotMatch(resolver, /idToken|password|photoBytes|privateKey/);
});
