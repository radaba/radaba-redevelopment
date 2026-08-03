import { legacySuccess } from "../compatibility/response.mjs";

export function createGetAorSummaryByIdHandler(service) {
  return async function getAorSummaryById(request) {
    const id = request.nextUrl.searchParams.has("assignment_id")
      ? request.nextUrl.searchParams.get("assignment_id")
      : undefined;
    return legacySuccess(await service.findByAssignmentId(id));
  };
}
