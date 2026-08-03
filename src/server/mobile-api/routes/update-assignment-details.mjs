import { legacyFailure, legacySuccess } from "../compatibility/response.mjs";
import { UnsupportedAssignmentTransitionError } from "../services/mobile-assignment-transition-service.mjs";

export function createUpdateAssignmentDetailsHandler(service, finishService) {
  return async function updateAssignmentDetails(request) {
    try {
      const body = await request.json();
      if (body?.assignment_state === "Finished" && finishService) {
        return legacySuccess(await finishService.finish(body));
      }
      if (!service.supports(body)) {
        return legacyFailure(400, "failed", "The assignment state not supported");
      }
      return legacySuccess(await service.transition(body));
    } catch (error) {
      if (error instanceof UnsupportedAssignmentTransitionError) {
        return legacyFailure(400, "failed", error.message);
      }
      return legacyFailure(500, "failed", error?.message);
    }
  };
}

