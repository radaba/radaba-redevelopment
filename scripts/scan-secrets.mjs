import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const SECRET_PATTERNS = Object.freeze([
  ["private_key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["firebase_service_account", /"type"\s*:\s*"service_account"[\s\S]{0,400}"private_key"/],
  ["google_api_key", /\bAIza[0-9A-Za-z_-]{30,}\b/],
  ["bearer_token", /\bBearer\s+[A-Za-z0-9_-]{30,}(?:\.[A-Za-z0-9_-]+){1,2}\b/],
  ["github_token", /\bgh[opsu]_[A-Za-z0-9]{30,}\b/],
]);
export function scanText(source) {
  return SECRET_PATTERNS.filter(([, pattern]) => pattern.test(source))
    .map(([name]) => name);
}
function files() {
  const output = execFileSync("git", [
    "ls-files", "--cached", "--others", "--exclude-standard",
  ], { encoding: "utf8" });
  return output.split(/\r?\n/).filter(Boolean).filter((path) =>
    !path.startsWith(".next/") && !path.startsWith("node_modules/") &&
    !path.endsWith(".log") && path !== ".env.example");
}
export function scanRepository() {
  const findings = [];
  for (const path of files()) {
    let source;
    try { source = readFileSync(path, "utf8"); } catch { continue; }
    for (const kind of scanText(source)) findings.push({ path, kind });
  }
  const trackedSensitive = execFileSync("git", ["ls-files"], { encoding: "utf8" })
    .split(/\r?\n/).filter((path) =>
      /(^|\/)(service-account.*\.json|\.env(?:\.|$))/i.test(path));
  for (const path of trackedSensitive) {
    findings.push({ path, kind: "sensitive_filename" });
  }
  return findings;
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const findings = scanRepository();
  if (findings.length) {
    for (const finding of findings) {
      console.error("secret-scan: " + finding.path + " [" + finding.kind + "]");
    }
    process.exit(1);
  }
  console.log("Secret scan passed for tracked and non-ignored working-tree files.");
}
