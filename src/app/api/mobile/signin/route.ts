import { FirebaseMobileClientAuthentication } from "@/server/mobile-api/authentication/firebase-client-adapter";
import { FirebaseMobileAuthProfileRepository } from "@/server/mobile-api/repositories/firebase-mobile-auth-profile-repositories";
import { createSigninHandler } from "@/server/mobile-api/routes/auth-profile-handlers.mjs";
import { createMobileSigninService } from "@/server/mobile-api/services/mobile-auth-profile-services.mjs";
import { formatLegacyJakartaDate, formatLegacyJakartaDatetime } from "@/server/mobile-api/compatibility/timestamps.mjs";
export const dynamic = "force-dynamic"; const handler = createSigninHandler(createMobileSigninService({ authentication: new FirebaseMobileClientAuthentication(), repository: new FirebaseMobileAuthProfileRepository(), clock: () => { const now = new Date(); return { date: formatLegacyJakartaDate(now), datetime: formatLegacyJakartaDatetime(now) }; } }));
export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE, handler as OPTIONS, handler as HEAD };
