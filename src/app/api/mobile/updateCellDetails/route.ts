import { secureMobileHandler } from "@/server/mobile-api/security/runtime";
import { FirebaseMobileCellCommandRepository } from "@/server/mobile-api/repositories/firebase-mobile-cell-command-repository";
import { createUpdateCellDetailsHandler } from "@/server/mobile-api/routes/update-cell-details.mjs";
import { createMobileCellCommandService } from "@/server/mobile-api/services/mobile-cell-command-service.mjs";

export const dynamic = "force-dynamic";

const compatibilityHandler = createUpdateCellDetailsHandler(
  createMobileCellCommandService(new FirebaseMobileCellCommandRepository()),
);

const handler = secureMobileHandler(compatibilityHandler, "updateCellDetails");
export { handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as OPTIONS,
  handler as HEAD,
};
