import { legacyRawError, legacySuccess } from "../compatibility/response.mjs";

export function createGetUtilityHandler(service) {
  return async function getUtility() {
    try {
      return legacySuccess(await service.firstByKey());
    } catch (error) {
      return legacyRawError(error);
    }
  };
}
