import { legacySuccess } from "../compatibility/response.mjs";
import { createLegacyJakartaClock } from "../compatibility/timestamps.mjs";

export function createGetCurrentTimeHandler(options = {}) {
  const clock = options.clock ?? createLegacyJakartaClock();
  return async function getCurrentTime() {
    return legacySuccess(clock.current());
  };
}

export const getCurrentTime = createGetCurrentTimeHandler();
