import { assertEnvironment } from "../src/server/environment/contract.mjs";

try {
  const result = assertEnvironment(process.env);
  console.log(JSON.stringify({
    status: "valid",
    environment: result.environment,
    fingerprint: result.fingerprint,
  }));
} catch (error) {
  console.error(error instanceof Error ? error.message : "Environment validation failed");
  process.exitCode = 1;
}
