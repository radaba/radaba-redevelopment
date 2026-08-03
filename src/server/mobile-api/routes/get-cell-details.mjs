import { legacyRawError, legacySuccess } from "../compatibility/response.mjs";
import { assertMobileCellRepository } from "../repositories/mobile-repositories.mjs";

export function createGetCellDetailsHandler(repository) {
  const cells = assertMobileCellRepository(repository);
  return async function getCellDetails(request) {
    const assignmentId = request.nextUrl.searchParams.has("assignment_id")
      ? request.nextUrl.searchParams.get("assignment_id")
      : undefined;
    try {
      return legacySuccess(await cells.findByAssignmentId(assignmentId));
    } catch (error) {
      return legacyRawError(error);
    }
  };
}
