import { readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const group = process.argv[2];
const roots = {
  full: ["tests"],
  unit: ["tests/auth", "tests/application-shell", "tests/settings"],
  integration: [
    "tests/admin", "tests/assignment", "tests/cells-images", "tests/firebase",
    "tests/notifications", "tests/operations", "tests/profile",
    "tests/reports", "tests/reports-center", "tests/riggers", "tests/search",
    "tests/system-health", "tests/tower-workspace", "tests/towers",
  ],
  mobile: ["tests/mobile-api"],
};
if (!roots[group]) {
  console.error("Unknown test group: " + String(group));
  process.exit(2);
}
function files(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const target = join(path, entry.name);
    return entry.isDirectory() ? files(target) :
      entry.name.endsWith(".test.js") ? [target] : [];
  });
}
const selected = roots[group].flatMap(files).sort();
const result = spawnSync(process.execPath, ["--test", ...selected], {
  stdio: "inherit",
});
process.exit(result.status ?? 1);
