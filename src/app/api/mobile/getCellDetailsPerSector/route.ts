import { secureMobileHandler } from "@/server/mobile-api/security/runtime";
import { FirebaseMobileCellRepository } from "@/server/mobile-api/repositories/firebase-mobile-cell-repository";
import { createGetCellDetailsPerSectorHandler } from "@/server/mobile-api/routes/get-cell-details-per-sector.mjs";
import { createMobileSectorReadService } from "@/server/mobile-api/services/mobile-cell-support-services.mjs";

export const dynamic = "force-dynamic";

const compatibilityHandler = createGetCellDetailsPerSectorHandler(
  createMobileSectorReadService(new FirebaseMobileCellRepository()),
);

const handler = secureMobileHandler(compatibilityHandler, "getCellDetailsPerSector");
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
export const HEAD = handler;
