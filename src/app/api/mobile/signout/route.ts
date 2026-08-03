import { createSignoutHandler } from "@/server/mobile-api/routes/auth-profile-handlers.mjs";
import { FirebaseMobileTokenVerifier } from "@/server/mobile-api/security/firebase-mobile-token-verifier";

export const dynamic = "force-dynamic";
const handler = createSignoutHandler(new FirebaseMobileTokenVerifier());
export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE, handler as OPTIONS, handler as HEAD };
