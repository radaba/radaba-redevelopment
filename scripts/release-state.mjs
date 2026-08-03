import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export function previousRelease(state, current) {
  if (!state || !Array.isArray(state.releases)) {
    throw new Error("Release state must contain a releases array");
  }
  const immutable = state.releases.filter((release) =>
    typeof release?.version === "string" &&
    /^[a-f0-9]{7,64}$/i.test(String(release.commit || "")) &&
    release.status === "healthy");
  const index = immutable.findIndex((release) => release.version === current);
  if (index < 1) throw new Error("No previous healthy immutable release");
  return immutable[index - 1];
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const [, , path, current] = process.argv;
  if (!path || !current) throw new Error("Usage: release-state.mjs <state.json> <current-version>");
  process.stdout.write(JSON.stringify(previousRelease(
    JSON.parse(readFileSync(path, "utf8")), current,
  )));
}
