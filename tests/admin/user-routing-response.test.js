import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8");
test("user list detail role status sessions photo and repair use RTDB push key", async () => {
  const list = await read("src/components/admin/admin-users-client.tsx"),
    repository = await read("src/server/admin/firebase-admin-data-repository.ts"),
    routes = await Promise.all(
      [
        "role",
        "status",
        "sessions",
        "photo",
        "identity-repair/preview",
        "identity-repair/commit",
      ].map((path) => read(`src/app/api/admin/users/[userKey]/${path}/route.ts`)),
    );
  assert.match(list, /home\/admin\/users\/\$\{encodeURIComponent\(user\.key\)\}/);
  assert.match(list, /api\/admin\/users\/\$\{encodeURIComponent\(editing\.user\.key\)\}/);
  assert.match(repository, /ref\(USER_PATH\)\.child\(userKey\)/);
  for (const route of routes) assert.match(route, /userKey/);
});
test("detail route exists validates push keys and directly reads user child", async () => {
  const page = await read("src/app/home/admin/users/[userKey]/page.tsx"),
    { validAdminUserKey } = await import("../../src/features/admin/admin-user-detail.mjs");
  assert.match(page, /validAdminUserKey\(userKey\)/);
  assert.match(page, /\.read\(userKey,actor\)/);
  assert.equal(validAdminUserKey("-OyvoV6osgCsGKJX9M2z"), true);
  for (const invalid of ["user/key", "user.key", "user#key", "user$key", "user[key]"])
    assert.equal(validAdminUserKey(invalid), false);
});
test("administrator API parser checks status and content type before JSON", async () => {
  const helper = await read("src/features/admin/admin-api-response.ts");
  assert.ok(helper.indexOf("if (!response.ok)") < helper.indexOf("response.json()"));
  assert.match(helper, /contentType\.includes\("application\/json"\)/);
  assert.match(helper, /await response\.text\(\)/);
  assert.match(helper, /expected JSON/);
});
test("role status privilege session invitation and repair clients use safe parser", async () => {
  for (const path of [
    "admin-users-client.tsx",
    "admin-privileges-client.tsx",
    "admin-session-revocation-button.tsx",
    "admin-user-invite-dialog.tsx",
    "admin-user-identity-repair.tsx",
  ]) {
    const source = await read(`src/components/admin/${path}`);
    assert.match(source, /readAdminApiResponse/);
    assert.doesNotMatch(source, /response\.json\(\)/);
  }
});
