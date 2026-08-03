import { secureMobileHandler } from "@/server/mobile-api/security/runtime";
import { FirebaseMobileAssignmentReadRepository } from "@/server/mobile-api/repositories/firebase-mobile-assignment-repository";
import { FirebaseMobileCellRepository } from "@/server/mobile-api/repositories/firebase-mobile-cell-repository";
import { FirebaseMobileImageReadRepository } from "@/server/mobile-api/repositories/firebase-mobile-image-repository";
import { createGetAorSummaryByIdHandler } from "@/server/mobile-api/routes/get-aor-summary-by-id.mjs";
import { createMobileAorSummaryService } from "@/server/mobile-api/services/mobile-read-services.mjs";

export const dynamic = "force-dynamic";
const compatibilityHandler = createGetAorSummaryByIdHandler(
  createMobileAorSummaryService({
    assignments: new FirebaseMobileAssignmentReadRepository(),
    cells: new FirebaseMobileCellRepository(),
    images: new FirebaseMobileImageReadRepository(),
  }),
);
const handler = secureMobileHandler(compatibilityHandler, "getAorSummaryById");
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
export const HEAD = handler;
