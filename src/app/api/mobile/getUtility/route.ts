import { FirebaseMobileUtilityReadRepository } from "@/server/mobile-api/repositories/firebase-mobile-utility-repository";
import { createGetUtilityHandler } from "@/server/mobile-api/routes/get-utility.mjs";
import { createMobileUtilityReadService } from "@/server/mobile-api/services/mobile-cell-support-services.mjs";

export const dynamic = "force-dynamic";

const handler = createGetUtilityHandler(
  createMobileUtilityReadService(new FirebaseMobileUtilityReadRepository()),
);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
export const HEAD = handler;
