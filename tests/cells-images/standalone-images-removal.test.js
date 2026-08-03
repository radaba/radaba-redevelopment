import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(path, "utf8");

test("standalone Images routes and UI components are removed", () => {
  for (const path of [
    "src/app/home/images/page.tsx",
    "src/app/home/images/[imageId]/page.tsx",
    "src/components/cells-images/images-operations.tsx",
    "src/components/cells-images/image-inspector.tsx",
  ]) assert.equal(fs.existsSync(path), false);
});

test("navigation and canonical privilege registry exclude standalone Images", () => {
  const navigation = read("src/components/application-shell/navigation-config.ts");
  const registry = read("src/features/admin/privilege-registry.mjs");
  assert.doesNotMatch(navigation, /Rigger Images|\/home\/images|id: "images"/);
  assert.doesNotMatch(registry, /rigger_images|persistedPath: "\/images"|navigationRoute: "\/home\/images"/);
});

test("desktop and mobile navigation no longer receive Images authorization state", () => {
  const sources = [
    read("src/app/home/layout.tsx"),
    read("src/components/application-shell/application-shell.tsx"),
    read("src/components/application-shell/application-sidebar.tsx"),
    read("src/components/application-shell/mobile-navigation.tsx"),
  ].join("\n");
  assert.doesNotMatch(sources, /canAccessRiggerImages|riggerImagesOnly/);
});

test("Cell evidence remains embedded and opens original stored references", () => {
  const workspace = read("src/components/cells-images/cell-engineering-workspace.tsx");
  assert.match(workspace, /extractEmbeddedImages/);
  assert.match(workspace, /id="cell-images"/);
  assert.match(workspace, /Open original/);
  assert.doesNotMatch(workspace, /\/home\/images/);
});

test("Assignment evidence and mobile image contracts remain intact", () => {
  const assignment = read("src/components/assignment/assignment-photo-evidence.tsx");
  const mobilePaths = read("src/server/mobile-api/repositories/mobile-repositories.mjs");
  const mobileCommand = read("src/server/mobile-api/repositories/firebase-mobile-image-command-repository.ts");
  assert.match(assignment, /assignment.*photo|photo/i);
  assert.match(mobilePaths, /image: "image"/);
  assert.match(mobileCommand, /MOBILE_RTDB_PATHS\.image/);
});

test("no web source links to the removed standalone route", () => {
  const files = fs.readdirSync("src", { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(?:ts|tsx|mjs|js)$/.test(entry.name));
  const matches = [];
  for (const entry of files) {
    const path = `${entry.parentPath.replaceAll("\\", "/")}/${entry.name}`;
    if (read(path).includes("/home/images")) matches.push(path);
  }
  assert.deepEqual(matches, []);
});
