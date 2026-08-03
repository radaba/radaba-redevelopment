import { existsSync, readFileSync } from "node:fs";

const configuration = JSON.parse(
  readFileSync("firebase.json", "utf8").replace(/^\uFEFF/, ""),
);
const errors = [];
function validateConfiguredRules(section) {
  const value = configuration[section];
  if (!value) return;
  const entries = Array.isArray(value) ? value : [value];
  for (const entry of entries) {
    const path = entry.rules;
    if (!path || !existsSync(path)) {
      errors.push(section + " rules path is missing");
      continue;
    }
    const source = readFileSync(path, "utf8");
    if (!/rules_version\s*=\s*'2'\s*;/.test(source)) {
      errors.push(path + " does not declare rules_version = '2'");
    }
    if (!/service\s+firebase\./.test(source) ||
        !/match\s+\//.test(source) ||
        !/allow\s+(read|write)/.test(source)) {
      errors.push(path + " does not contain a recognizable Firebase rules contract");
    }
  }
}
validateConfiguredRules("storage");
validateConfiguredRules("database");
validateConfiguredRules("firestore");
if (!configuration.storage) errors.push("Storage rules are not configured");
if (errors.length) {
  console.error("Firebase rules validation failed:\n- " + errors.join("\n- "));
  process.exit(1);
}
console.log(JSON.stringify({
  status: "valid",
  storage: "validated",
  database: configuration.database ? "validated" : "not-present",
  firestore: configuration.firestore ? "validated" : "not-present",
}));
