import { secureMobileHandler } from "@/server/mobile-api/security/runtime";
import { FirebaseMobileAssignmentReadRepository } from "@/server/mobile-api/repositories/firebase-mobile-assignment-repository";
import { createGetAssignmentsByIdHandler } from "@/server/mobile-api/routes/get-assignments-by-id.mjs";
import { createMobileAssignmentReadService } from "@/server/mobile-api/services/mobile-read-services.mjs";

export const dynamic = "force-dynamic";
const compatibilityHandler = createGetAssignmentsByIdHandler(
  createMobileAssignmentReadService(new FirebaseMobileAssignmentReadRepository()),
);
const handler = secureMobileHandler(compatibilityHandler, "getassignmentsById");
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
export const HEAD = handler;
