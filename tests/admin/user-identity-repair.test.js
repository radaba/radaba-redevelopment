import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8");
const service = await read("src/server/admin/user-identity-repair-service.ts");
const repository = await read("src/server/admin/firebase-user-identity-repair.ts");
const previewRoute = await read(
  "src/app/api/admin/users/[userKey]/identity-repair/preview/route.ts",
);
const commitRoute = await read("src/app/api/admin/users/[userKey]/identity-repair/commit/route.ts");
const dialog = await read("src/components/admin/admin-user-identity-repair.tsx");
test("preview and commit require strict administrator resolution before work", () => {
  for (const route of [previewRoute, commitRoute]) {
    assert.ok(
      route.indexOf("await resolveAdministrator()") <
        route.lastIndexOf("new UserIdentityRepairService"),
    );
    assert.match(route, /validAdminUserKey/);
  }
});
test("route key selects RTDB profile and server resolves Auth by profile email", () => {
  assert.match(service, /repository\.findUser\(userKey\)/);
  assert.match(service, /auth\.findByEmail\(email\)/);
  assert.match(
    dialog,
    /JSON\.stringify\(\{ baseline: preview\.baseline, reason, confirmation \}\)/,
  );
  assert.doesNotMatch(dialog, /JSON\.stringify\(\{[^}]*\b(uid|email|userKey)\b/);
  assert.match(repository, /getUserByEmail\(email\)/);
});
test("missing profile Auth user Auth email and mismatched email are blocked", () => {
  for (const code of ["user_not_found", "auth_user_not_found", "email_mismatch"])
    assert.match(service, new RegExp(`"${code}"`));
});
test("preview checks normalized email uniqueness target UID ownership and old UID Auth ownership", () => {
  assert.match(service, /findUsersByUid\(authUser\.uid\)/);
  assert.match(service, /findUsersByEmail\(email\)/);
  assert.match(service, /auth\.findByUid\(user\.uid\)/);
  assert.match(service, /duplicate_email/);
  assert.match(service, /target_uid_already_linked/);
  assert.match(service, /identity_ownership_ambiguous/);
  assert.match(repository, /toLowerCase\(\) === email\.trim\(\)\.toLowerCase\(\)/);
});
test("missing UID stays on separate legacy policy and already repaired is safe", () => {
  assert.match(service, /!user\.uid\) blockers\.push\("legacy_uid_missing"\)/);
  assert.match(service, /user\.uid === authUser\.uid\) blockers\.push\("already_repaired"\)/);
});
test("preview is read-only and proposes only uid", () => {
  const body = service.slice(service.indexOf("async preview"), service.indexOf("async commit"));
  assert.doesNotMatch(body, /commitUidAndAudit|\.set\(|\.update\(|transaction/);
  assert.match(body, /proposedChange: \{ field: "uid"/);
});
test("preview reports protected fields as unchanged", () => {
  for (const field of [
    "email",
    "name",
    "phone",
    "role",
    "privileges",
    "status",
    "administrator state",
    "company",
    "profile-photo metadata",
  ])
    assert.match(service, new RegExp(`"${field}"`));
});
test("commit requires reason exact phrase and matching preview baseline", () => {
  assert.match(service, /REPAIR USER IDENTITY/);
  assert.match(service, /reason\.length < 5/);
  assert.match(service, /input\.baseline !== preview\.baseline/);
  assert.match(service, /"user_changed"/);
});
test("commit repeats preview validation and reloads Firebase Auth", () => {
  const commit = service.slice(service.indexOf("async commit"));
  assert.match(commit, /await this\.preview\(userKey\)/);
  assert.ok(commit.indexOf("preview(userKey)") < commit.indexOf("commitUidAndAudit"));
});
test("atomic transaction rechecks UID email deletion duplicates and changes only target uid", () => {
  assert.match(repository, /database\.ref\(\)\.transaction/);
  assert.match(repository, /current\.uid !== input\.expectedUid/);
  assert.match(repository, /current\.email\?\.trim\(\)\.toLowerCase\(\) !== input\.expectedEmail/);
  assert.match(repository, /target_uid_already_linked/);
  assert.match(repository, /duplicate_email/);
  assert.match(
    repository,
    /\.\.\.\(currentRaw as Record<string, unknown>\), uid: input\.targetUid/,
  );
  assert.doesNotMatch(repository, /updateUser\(|updateUserRole|setDisabled/);
});
test("UID repair and administrator audit commit atomically at the root", () => {
  assert.match(repository, /user: \{ \.\.\.users, \[input\.userKey\]: mutableUser \}/);
  assert.match(repository, /administrator_audit: \{/);
  assert.match(service, /source: "administrator_identity_repair"/);
  assert.match(service, /confirmationMethod: IDENTITY_REPAIR_CONFIRMATION/);
  assert.match(service, /previewBaseline: preview\.baseline/);
});
test("dialog shows exact change duplicate checks unchanged fields and gated commit", () => {
  for (const text of [
    "Repair Firebase Identity",
    "Current stored UID",
    "Correct Firebase Auth UID",
    "Target UID matches",
    "Email matches",
    "Only mutation:",
    "Unchanged:",
    "Administrator reason",
    "REPAIR USER IDENTITY",
    "Firebase identity repaired successfully",
  ])
    assert.match(dialog, new RegExp(text));
  assert.match(dialog, /!preview\.canRepair/);
  assert.match(dialog, /reason\.trim\(\)\.length < 5/);
  assert.match(dialog, /confirmation !== PHRASE/);
});
test("Profile resolver security and exact UID behavior remain unchanged", async () => {
  const resolver = await read("src/server/profile/authenticated-profile-resolver.ts");
  assert.match(resolver, /findByUid\(actor\.uid\)/);
  assert.match(resolver, /verified_email_compatibility/);
  assert.match(resolver, /profile_identity_corrupt/);
  assert.doesNotMatch(resolver, /update.*uid|set.*uid/i);
});
test("mobile authentication implementation is not coupled to identity repair", async () => {
  const mobile = await read("src/server/mobile-api/routes/auth-profile-handlers.mjs");
  assert.doesNotMatch(mobile, /identity-repair|administrator_identity_repair/);
});
