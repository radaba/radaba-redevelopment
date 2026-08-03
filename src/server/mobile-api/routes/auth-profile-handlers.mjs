import { resolveMobileToken } from "../security/token-resolver.mjs";
import { legacyFailure, legacySuccess } from "../compatibility/response.mjs";
import { mapLoginError, mapResetError } from "../services/mobile-auth-profile-services.mjs";

export const createSigninHandler = (service) => async (request) => {
  try { const body = await request.json(); const { email, password, browser = "", ip_address = "" } = body || {}; if (!email || !password) return legacyFailure(400, "failed", "Email and password are required"); const result = await service.signIn({ email, password, browser, ipAddress: ip_address }); const response = legacySuccess(result.data); response.headers.append("set-cookie", `__session=${result.token}; Max-Age=2592000; Path=/; HttpOnly; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`); return response; }
  catch (error) { const friendly = mapLoginError(error?.code); return friendly ? legacyFailure(401, "failed", friendly) : legacyFailure(500, "failed", error?.message || "Unknown error"); }
};
export const createResetPasswordHandler = (service) => async (request) => { try { const email = request.nextUrl.searchParams.has("email") ? request.nextUrl.searchParams.get("email") : undefined; await service.send(email); return legacySuccess("The link reset password has been sent to your email address"); } catch (error) { const friendly = mapResetError(error?.code); return friendly ? legacyFailure(401, "failed", friendly) : legacyFailure(500, "failed", error?.message); } };
export const createUpdateUserDetailsHandler = (service) => async (request) => { const email = request.nextUrl.searchParams.has("email") ? request.nextUrl.searchParams.get("email") : undefined; try { return legacySuccess(await service.update(email, await request.json())); } catch (error) { return legacyFailure(500, "failed", error?.message); } };
export const createSignoutHandler = (verifier) => async (request) => {
  const resolved = resolveMobileToken(request);
  if (!resolved.ok && resolved.reason === "missing_token") {
    const response = legacySuccess("You already logout/session expired", { message: "You already logout/session expired" });
    response.headers.append("set-cookie", "__session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax");
    return response;
  }
  if (!resolved.ok) return legacyFailure(401, "failed", "Authentication required");
  try {
    const claims = await verifier.verify(resolved.token);
    const uid = claims?.uid || claims?.sub;
    if (!uid) return legacyFailure(401, "failed", "Authentication required");
    await verifier.revoke(uid);
    const response = legacySuccess({ uid }, { message: "LOGOUT." });
    response.headers.append("set-cookie", "__session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax");
    return response;
  } catch {
    return legacyFailure(401, "failed", "Authentication required");
  }
};
