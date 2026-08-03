import { secureMobileHandler } from "@/server/mobile-api/security/runtime";
import { FirebaseMobileCellRepository } from "@/server/mobile-api/repositories/firebase-mobile-cell-repository";
import { createGetCellDetailsHandler } from "@/server/mobile-api/routes/get-cell-details.mjs";

export const dynamic = "force-dynamic";

const compatibilityHandler = createGetCellDetailsHandler(new FirebaseMobileCellRepository());

const handler = secureMobileHandler(compatibilityHandler, "getCellDetails");
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
export const HEAD = handler;
