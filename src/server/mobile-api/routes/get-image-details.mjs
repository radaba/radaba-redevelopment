import { legacyRawError, legacySuccess } from "../compatibility/response.mjs";

function assignmentId(request) {
  return request.nextUrl.searchParams.has("assignment_id")
    ? request.nextUrl.searchParams.get("assignment_id")
    : undefined;
}

export function createGetImageDetailsHandler(service) {
  return async function getImageDetails(request) {
    try {
      return legacySuccess(await service.firstByAssignmentId(assignmentId(request)));
    } catch (error) {
      return legacyRawError(error);
    }
  };
}
