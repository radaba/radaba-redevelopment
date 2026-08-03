import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  PROFILE_PHOTO_MAX_BYTES,
  cleanProfilePhotoName,
  validProfilePhotoSignature,
  validateProfilePhotoFile,
} from "../../src/features/profile/profile-photo-contract.mjs";

const read = (path) => fs.readFileSync(path, "utf8"),
  route = read("src/app/api/profile/photo/route.ts"),
  service = read("src/server/profile/profile-photo-service.ts"),
  repository = read("src/server/profile/firebase-profile-photo-repository.ts"),
  workspace = read("src/app/home/profile/profile-workspace.tsx"),
  layout = read("src/app/home/layout.tsx"),
  menu = read("src/components/application-shell/user-menu.tsx");
const file = (name, type, size = 12) => ({
  name,
  type,
  size,
  arrayBuffer: async () => new ArrayBuffer(size),
});

test("accepts JPG JPEG PNG and WebP up to five MiB", () => {
  for (const [name, type] of [
    ["a.jpg", "image/jpeg"],
    ["a.jpeg", "image/jpeg"],
    ["a.png", "image/png"],
    ["a.webp", "image/webp"],
  ])
    assert.equal(validateProfilePhotoFile(file(name, type)).valid, true);
  assert.equal(PROFILE_PHOTO_MAX_BYTES, 5 * 1024 * 1024);
});
test("rejects GIF PDF executable mismatched and oversized files", () => {
  for (const [name, type] of [
    ["a.gif", "image/gif"],
    ["a.pdf", "application/pdf"],
    ["a.exe", "application/octet-stream"],
    ["a.png", "image/jpeg"],
  ])
    assert.equal(validateProfilePhotoFile(file(name, type)).valid, false);
  const result = validateProfilePhotoFile(
    file("large.jpg", "image/jpeg", PROFILE_PHOTO_MAX_BYTES + 1),
  );
  assert.equal(result.valid, false);
  assert.equal(result.code, "photo-file-too-large");
});
test("validates actual JPEG PNG and WebP signatures", () => {
  assert.equal(validProfilePhotoSignature(Uint8Array.from([0xff, 0xd8, 0xff]), "image/jpeg"), true);
  assert.equal(
    validProfilePhotoSignature(
      Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      "image/png",
    ),
    true,
  );
  assert.equal(
    validProfilePhotoSignature(
      Uint8Array.from([82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80]),
      "image/webp",
    ),
    true,
  );
  assert.equal(validProfilePhotoSignature(Uint8Array.from([37, 80, 68, 70]), "image/png"), false);
});
test("cleans stored display name without allowing paths", () => {
  assert.equal(cleanProfilePhotoName("../folder\\avatar.jpg"), ".._folder_avatar.jpg");
});
test("server derives versioned Storage objects from authenticated Firebase UID", () => {
  assert.match(service, /profile-photo\/\$\{resolved\.authUid\}\/avatar-/);
  assert.match(route, /resolveAuthenticatedUser/);
  assert.match(route, /uid:\s*user\.uid/);
  assert.doesNotMatch(route, /form\.get\("uid"\)|params.*uid|body.*uid/);
});
test("replacement commits new metadata before deleting the previous owned object", () => {
  assert.ok(
    service.indexOf("saveObject(newPath") < service.indexOf("updateUserPhoto(resolved.userKey"),
  );
  assert.ok(
    service.indexOf("updateUserPhoto(resolved.userKey") <
      service.indexOf("deleteObject(previousPath)"),
  );
  assert.match(service, /deleteObject\(newPath\)\.catch/);
  assert.match(service, /cleanupWarning/);
});
test("RTDB mutation persists only approved photo metadata", () => {
  assert.match(service, /photo_url:\s*"\/api\/profile\/photo"/);
  assert.match(service, /photo_name:\s*validation\.name/);
  assert.match(service, /updated_at:\s*updatedAt/);
  assert.match(repository, /\.update\(value\)/);
  const updateMethod = repository.slice(repository.indexOf("async updateUserPhoto"));
  assert.doesNotMatch(updateMethod, /bytes|base64|data_url|uid\s*:/i);
});
test("authenticated read endpoint serves private no-store image bytes", () => {
  assert.match(route, /export async function GET/);
  assert.match(route, /Cache-Control":\s*"private, no-store"/);
  assert.match(route, /X-Content-Type-Options/);
  assert.match(read("storage.rules"), /allow read, write: if false/);
});
test("Profile provides preview validation upload cancellation and immediate refresh", () => {
  assert.match(workspace, /URL\.createObjectURL/);
  assert.match(workspace, /URL\.revokeObjectURL/);
  assert.match(workspace, /accept="image\/jpeg,image\/png,image\/webp/);
  assert.match(workspace, /fetch\("\/api\/profile\/photo"/);
  assert.match(workspace, /setPhotoUrl\(payload\.data\.photoUrl\)/);
  assert.match(workspace, /router\.refresh\(\)/);
});
test("Profile and top navigation render image with initials fallback", () => {
  assert.match(workspace, /photoPreview \|\| photoUrl/);
  assert.match(workspace, /initials\(profile\.name, user\.email\)/);
  assert.match(layout, /photoUrl:\s*user\.photo_url/);
  assert.match(menu, /user\.photoUrl/);
  assert.match(menu, /initials/);
});
test("photo removal clears metadata before owned-object cleanup and restores fallback", () => {
  assert.match(route, /export async function DELETE/);
  assert.ok(
    service.indexOf("clearUserPhoto(resolved.userKey") < service.indexOf("deleteObject(path)"),
  );
  assert.match(service, /profile_photo_removed/);
  assert.match(workspace, /Remove Photo/);
  assert.match(workspace, /setPhotoUrl\(""\)/);
});
test("photo upload replace and remove write metadata-only audit", () => {
  assert.match(service, /recordAdministratorAudit/);
  assert.match(service, /profile_photo_\$\{action\}/);
  assert.match(service, /profile_photo_removed/);
  assert.doesNotMatch(service, /after:\s*\{[^}]*bytes/s);
});
