import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getActiveNavigationItem } from "../../src/components/application-shell/navigation-active.mjs";
const read = (path) => fs.readFileSync(path, "utf8");
const config = () => read("src/components/application-shell/navigation-config.ts");
const expected = [
  ["Assignment", "/home/assignment"],
  ["Dashboard", "/home/assignment/dashboard"],
  ["Towers", "/home/towers"],
  ["Cells", "/home/cells"],
  ["AOR Reports", "/home/reports"],
  ["Riggers", "/home/riggers"],
  ["Profile", "/home/profile"],
  ["Settings", "/home/settings"],
  ["Users", "/home/admin/users"],
  ["Roles", "/home/admin/roles"],
  ["Privileges", "/home/admin/privileges"],
  ["Audit Center", "/home/admin/audit"],
  ["Assignment Maintenance", "/home/admin/assignment-maintenance"],
];
test("central navigation defines the complete Operations and Administration menu with real routes", () => {
  const source = config();
  for (const [label, href] of expected) {
    assert.match(
      source,
      new RegExp(`label: "${label}"[\\s\\S]{0,100}href: "${href.replaceAll("/", "\\/")}"`),
    );
  }
  assert.ok((source.match(/section: "Operations"/g) ?? []).length >= 8);
  assert.ok((source.match(/section: "Administration"/g) ?? []).length >= 5);
});
test("authorization visibility remains server-derived and administration is filtered", () => {
  const configSource = config(),
    layout = read("src/app/home/layout.tsx");
  assert.match(configSource, /!item\.administratorOnly \|\| isAdministrator/);
  assert.match(configSource, /!item\.assignmentOnly \|\| canAccessAssignments/);
  assert.match(layout, /canAdministrate\(user\)/);
  assert.match(layout, /canAccessAssignment\(user\.privilege, user\.role\)/);
});
test("longest matching route activates exactly one correct item", () => {
  const items = expected.map(([label, href]) => ({ id: label, href }));
  assert.equal(getActiveNavigationItem("/home/towers/-key", items).href, "/home/towers");
  assert.equal(
    getActiveNavigationItem("/home/admin/privileges/history", items).href,
    "/home/admin/privileges",
  );
  assert.equal(
    getActiveNavigationItem("/home/assignment/dashboard", items).href,
    "/home/assignment/dashboard",
  );
  assert.notEqual(
    getActiveNavigationItem("/home/assignment/dashboard", items).href,
    "/home/assignment",
  );
  assert.equal(
    getActiveNavigationItem("/home/admin/assignment-maintenance", items).href,
    "/home/admin/assignment-maintenance",
  );
  assert.equal(getActiveNavigationItem("/home/unknown", items), undefined);
});
test("desktop and mobile consume the same config matcher and expose accessible active links", () => {
  const desktop = read("src/components/application-shell/application-sidebar.tsx"),
    mobile = read("src/components/application-shell/mobile-navigation.tsx");
  for (const source of [desktop, mobile]) {
    assert.match(source, /getVisibleNavigation/);
    assert.match(source, /getActiveNavigationItem/);
    assert.match(source, /activeItem\?\.id === item\.id/);
    assert.match(source, /aria-current=\{active \? "page" : undefined\}/);
    assert.match(source, /focus-visible:ring-2/);
  }
  assert.match(mobile, /onClick=\{onClose\}/);
  assert.match(mobile, /aria-label="Mobile primary navigation"/);
  assert.doesNotMatch(mobile, /const navigation = \[/);
});
test("sidebar changes do not introduce routes privilege names or data access", () => {
  const sources =
    config() +
    read("src/components/application-shell/application-sidebar.tsx") +
    read("src/components/application-shell/mobile-navigation.tsx");
  assert.doesNotMatch(sources, /firebase|database|RTDB|fetch\(|POST|PATCH|PUT|DELETE/);
});
