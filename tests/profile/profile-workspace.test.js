import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const workspace = fs.readFileSync("src/app/home/profile/profile-workspace.tsx", "utf8");
const page = fs.readFileSync("src/app/home/profile/page.tsx", "utf8");
const api = fs.readFileSync("src/app/api/profile/route.ts", "utf8");
const service = fs.readFileSync("src/server/profile/profile-service.ts", "utf8");
const repository = fs.readFileSync("src/server/profile/firebase-profile-repository.ts", "utf8");
const auth = fs.readFileSync("src/services/authentication/client-authentication.ts", "utf8");

test("Profile remains inside the authenticated home shell", () => {
  assert.match(page, /useApplicationShellUser/);
  assert.match(api, /resolveAuthenticatedUser/);
  assert.doesNotMatch(api, /userKey|userId|uid:body|email:body/);
});
test("focused responsive workspace renders current identity and approved fields", () => {
  for (const value of [
    "Profile",
    "Manage your personal information and account security",
    "Account summary",
    "Personal information",
    "Full name",
    "Phone number",
    "lg:grid-cols",
  ])
    assert.match(workspace, new RegExp(value));
});
test("role status email UID and organization controls remain read-only", () => {
  assert.match(workspace, /Email is your Firebase login identity and cannot be changed here/);
  assert.match(
    workspace,
    /Role, privileges, account status, UID, and organization fields are\s+administrator-controlled/,
  );
  assert.doesNotMatch(workspace, /register\("(?:email|role|status|uid|company|department|region)/);
});
test("profile form uses React Hook Form Zod validation and disables unchanged save", () => {
  assert.match(workspace, /useForm<ProfileForm>/);
  assert.match(workspace, /zodResolver\(profileSchema\)/);
  assert.match(workspace, /disabled=\{!isDirty\s*\|\|\s*isSubmitting\}/);
  assert.match(workspace, /Full name is required/);
  assert.match(workspace, /Enter a valid phone number/);
});
test("valid profile changes use only current-session endpoint and optimistic expected values", () => {
  assert.match(workspace, /fetch\("\/api\/profile"/);
  assert.match(workspace, /expected:\s*profile/);
  assert.match(repository, /\.transaction\(/);
  assert.match(
    repository,
    /before\.name\s*!==\s*expected\.name\s*\|\|\s*before\.phone\s*!==\s*expected\.phone/,
  );
  assert.match(service, /profile_changed/);
});
test("profile update writes changed editable fields only and removes optional blank phone", () => {
  assert.match(repository, /updated\.name = next\.name/);
  assert.match(repository, /delete updated\.phone/);
  assert.doesNotMatch(repository, /updated\.(?:role|status|uid|email|company|privilege)/);
  assert.match(service, /result\.changedFields/);
});
test("self-service audit contains approved before and after fields with source", () => {
  assert.match(service, /profile_self_service_update/);
  assert.match(service, /source:\s*"profile_self_service"/);
  assert.match(service, /result\.changedFields\.map/);
  assert.doesNotMatch(service, /password|token|credential/i);
});
test("conflict refreshes latest values and requires review before another save", () => {
  assert.match(workspace, /payload\.code\s*===\s*"profile_changed"/);
  assert.match(workspace, /fetch\("\/api\/profile",\s*\{\s*cache:\s*"no-store"\s*\}\)/);
  assert.match(workspace, /reset\(next\)/);
});
test("password validation requires all fields rejects mismatch same and weak values", () => {
  for (const message of [
    "Current password is required",
    "New password is required",
    "Password confirmation is required",
    "Password confirmation does not match",
    "New password must differ",
    "New password is too weak",
  ])
    assert.match(workspace, new RegExp(message));
});
test("password flow reauthenticates updates refreshes server session and clears client auth", () => {
  for (const method of [
    "EmailAuthProvider.credential",
    "reauthenticateWithCredential",
    "updatePassword",
    "getIdToken(true)",
    "signOut(firebaseAuth)",
  ])
    assert.match(auth, new RegExp(method.replace(/[().]/g, "\\$&")));
  assert.match(auth, /fetch\("\/api\/auth\/login"/);
  assert.match(workspace, /reset\(\)/);
});
test("password dialog blocks duplicate submission and clears on close", () => {
  assert.match(workspace, /disabled=\{isSubmitting\}/);
  assert.match(workspace, /dialog\.current\?\.close/);
  assert.match(workspace, /reset\(\);\s*setNotice\(null\)/);
  assert.match(workspace, /showModal\(\)/);
});
test("password failures use safe mapped messages", () => {
  for (const message of [
    "Current password is incorrect",
    "New password is too weak",
    "Please sign in again",
    "Too many attempts",
    "Network error",
  ])
    assert.match(auth, new RegExp(message));
  assert.doesNotMatch(workspace, /error\.message|FirebaseError/);
});
test("passwords never enter profile API repository or audit", () => {
  for (const source of [api, service, repository])
    assert.doesNotMatch(
      source,
      /currentPassword|newPassword|confirmPassword|updatePassword|reauthenticate/,
    );
});
test("mobile layout stacks controls with full-width dialog sizing", () => {
  assert.match(workspace, /grid gap-5 lg:grid-cols/);
  assert.match(workspace, /flex flex-col gap-4 sm:flex-row/);
  assert.match(workspace, /w-\[calc\(100%-2rem\)\] max-w-md/);
});
