import { secureMobileHandler } from "@/server/mobile-api/security/runtime";
import { FirebaseMobileImageReadRepository } from "@/server/mobile-api/repositories/firebase-mobile-image-repository";
import { createGetImageDetailsHandler } from "@/server/mobile-api/routes/get-image-details.mjs";
import { createMobileImageReadService } from "@/server/mobile-api/services/mobile-read-services.mjs";

export const dynamic = "force-dynamic";
const compatibilityHandler = createGetImageDetailsHandler(
  createMobileImageReadService(new FirebaseMobileImageReadRepository()),
);
const handler = secureMobileHandler(compatibilityHandler, "getImageDetails");
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
export const HEAD = handler;
