import { legacySuccess } from "../compatibility/response.mjs";

function assignmentId(request) {
  return request.nextUrl.searchParams.has("assignment_id")
    ? request.nextUrl.searchParams.get("assignment_id")
    : undefined;
}

export function createGetAssignmentsByIdHandler(service) {
  return async function getAssignmentsById(request) {
    return legacySuccess(await service.firstByAssignmentId(assignmentId(request)));
  };
}
