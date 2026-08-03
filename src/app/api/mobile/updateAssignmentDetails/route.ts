import { secureMobileHandler } from "@/server/mobile-api/security/runtime";
import { createLegacyAssignmentTransitionClock } from "@/server/mobile-api/compatibility/assignment-transition-clock.mjs";
import { FirebaseMobileAssignmentCommandRepository } from "@/server/mobile-api/repositories/firebase-mobile-assignment-command-repository";
import { FirebaseMobileAssignmentFinishRepository } from "@/server/mobile-api/repositories/firebase-mobile-assignment-finish-repository";
import { createUpdateAssignmentDetailsHandler } from "@/server/mobile-api/routes/update-assignment-details.mjs";
import { createMobileAssignmentTransitionService } from "@/server/mobile-api/services/mobile-assignment-transition-service.mjs";
import { createMobileAssignmentFinishService } from "@/server/mobile-api/services/mobile-assignment-finish-service.mjs";

export const dynamic = "force-dynamic";

const compatibilityHandler = createUpdateAssignmentDetailsHandler(
  createMobileAssignmentTransitionService(
    new FirebaseMobileAssignmentCommandRepository(),
    createLegacyAssignmentTransitionClock(),
  ),
  createMobileAssignmentFinishService(
    new FirebaseMobileAssignmentFinishRepository(),
    createLegacyAssignmentTransitionClock(),
  ),
);

const handler = secureMobileHandler(compatibilityHandler, "updateAssignmentDetails");
export { handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as OPTIONS,
  handler as HEAD,
};

