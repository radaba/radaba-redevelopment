export async function createVerifiedSession({ idToken, verifyIdToken, resolveUser, createSessionCookie, expiresIn }) {
  if (typeof idToken !== "string" || !idToken.trim()) throw new Error("Firebase ID token is required.");
  const decodedToken = await verifyIdToken(idToken);
  const user = await resolveUser(decodedToken);
  const sessionCookie = await createSessionCookie(idToken, { expiresIn });
  return { user, sessionCookie };
}

export async function resolveVerifiedSession({ cookieValue, verifySessionCookie, resolveUser, checkRevoked = true }) {
  if (!cookieValue) throw new Error("Unauthorized");
  const decodedToken = await verifySessionCookie(cookieValue, checkRevoked);
  return resolveUser(decodedToken);
}

export async function logoutSession({ cookieValue, verifySessionCookie, revokeRefreshTokens, clearCookie, revoke = true }) {
  try {
    if (revoke && cookieValue) {
      const decodedToken = await verifySessionCookie(cookieValue, false);
      if (decodedToken?.uid) await revokeRefreshTokens(decodedToken.uid);
    }
  } catch {
    // Logout is idempotent for invalid, expired, and already-revoked cookies.
  } finally {
    await clearCookie();
  }
}
