import { legacyRawError, legacySuccess } from "../compatibility/response.mjs";

export function createGetCellDetailsPerSectorHandler(service) {
  return async function getCellDetailsPerSector(request) {
    const rcellId = request.nextUrl.searchParams.has("rcell_id")
      ? request.nextUrl.searchParams.get("rcell_id")
      : undefined;
    try {
      return legacySuccess(await service.findByRcellId(rcellId));
    } catch (error) {
      return legacyRawError(error);
    }
  };
}
