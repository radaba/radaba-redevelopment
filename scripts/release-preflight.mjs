import { execFileSync } from "node:child_process";
import { assertEnvironment } from "../src/server/environment/contract.mjs";

const environment = assertEnvironment(process.env, {
  requireRuntimeCredential: ["staging", "production"].includes(process.env.RADABA_ENV),
});
const status = execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" });
if (status.trim()) throw new Error("Release requires a clean worktree");
const commit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (process.env.RELEASE_COMMIT && process.env.RELEASE_COMMIT !== commit) {
  throw new Error("RELEASE_COMMIT does not match the checked-out commit");
}
if (environment.environment === "production" &&
    !/^v\d+\.\d+\.\d+$/.test(process.env.RELEASE_TAG || "")) {
  throw new Error("Production requires RELEASE_TAG in vMAJOR.MINOR.PATCH form");
}
console.log(JSON.stringify({
  status: "release-ready",
  environment: environment.environment,
  fingerprint: environment.fingerprint,
  commit,
  tag: process.env.RELEASE_TAG || null,
}));
