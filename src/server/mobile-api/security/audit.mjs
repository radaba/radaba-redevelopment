import { createHash, randomUUID } from "node:crypto";

const digest = (value) => value
  ? createHash("sha256").update(String(value)).digest("hex").slice(0, 12)
  : null;

export function createMobileSecurityAudit(logger = console, clock = () => new Date(), id = randomUUID) {
  return {
    record(input) {
      try {
        logger.info("mobile_security", {
          request_id: input.requestId || id(),
          route: input.route,
          method: input.method,
          mode: input.mode,
          actor: digest(input.uid),
          decision: input.allowed ? "allow" : "violation",
          reason_code: input.reason || "allowed",
          object_type: input.objectType || null,
          object_identifier: digest(input.objectId),
          timestamp: clock().toISOString(),
        });
      } catch {
        // Security telemetry must never change API behavior.
      }
    },
  };
}
