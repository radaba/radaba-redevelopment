import { firebaseAdminAuth, firebaseAdminDatabase } from "@/lib/firebase/admin";
import { buildLegacyUserSessionPayload } from "@/lib/auth/compat";
import { getSessionCookie, clearSessionCookie, SESSION_EXPIRES_IN_MS } from "@/lib/auth/session";
import { createVerifiedSession, logoutSession, resolveVerifiedSession } from "@/lib/auth/session-lifecycle.mjs";
import type { DecodedIdToken } from "firebase-admin/auth";
import type { User } from "@/types/user";

export interface ResetPayload {
  email: string;
}

export interface AuthenticatedSessionResult {
  user: User;
}

export interface AuthErrorResult {
  message: string;
}

function getUserRecordFromEmail(email: string) {
  return firebaseAdminDatabase
    .ref("user")
    .orderByChild("email")
    .equalTo(email)
    .once("value");
}

function getPrivileges() {
  return firebaseAdminDatabase.ref("privilege").once("value");
}

function sanitizeUserRecord(userEntry: Record<string, unknown>, userKey: string, uid: string, email: string, role: string, status: string) {
  return buildLegacyUserSessionPayload(
    {
      ...userEntry,
      user_key: userKey,
      email,
      uid,
      role,
      status,
    },
    null,
  ) as User;
}

async function resolveUserFromDecodedClaims(decodedToken: DecodedIdToken) {
  const uid = decodedToken.uid;
  const email = decodedToken.email?.trim().toLowerCase() ?? "";

  if (!uid || !email) {
    throw new Error("Unauthorized");
  }

  const userSnapshot = await getUserRecordFromEmail(email);
  const userNode = userSnapshot.val();

  if (!userNode) {
    throw new Error("User not found.");
  }

  const [userKey, userEntry] = Object.entries(userNode as Record<string, Record<string, unknown>>)[0];
  const role = String(userEntry.role ?? "");
  const status = String(userEntry.status ?? "");

  if (["not active", "inactive"].includes(status.trim().toLowerCase())) {
    throw new Error("Your account has been deactivated. Please contact an administrator.");
  }

  const privilegeSnapshot = await getPrivileges();
  const privilege = privilegeSnapshot.val();

  const verifiedUser = sanitizeUserRecord(userEntry, userKey, uid, email, role, status);
  verifiedUser.privilege = privilege as User["privilege"];

  return verifiedUser;
}

export async function resolveAuthenticatedUser() {
  const cookieValue = await getSessionCookie();
  return resolveVerifiedSession({
    cookieValue,
    verifySessionCookie: (value: string, checkRevoked: boolean) => firebaseAdminAuth.verifySessionCookie(value, checkRevoked),
    resolveUser: resolveUserFromDecodedClaims,
    checkRevoked: true,
  });
}

export async function createAuthenticatedSession(idToken: unknown) {
  return createVerifiedSession({
    idToken,
    verifyIdToken: (value: string) => firebaseAdminAuth.verifyIdToken(value),
    resolveUser: resolveUserFromDecodedClaims,
    createSessionCookie: (value: string, options: { expiresIn: number }) => firebaseAdminAuth.createSessionCookie(value, options),
    expiresIn: SESSION_EXPIRES_IN_MS,
  });
}

export async function sendPasswordResetEmail(payload: ResetPayload) {
  const email = payload.email?.trim().toLowerCase();

  if (!email) {
    throw new Error("Email is required.");
  }

  await firebaseAdminAuth.generatePasswordResetLink(email);

  return { success: true };
}

export async function logoutAuthenticatedSession() {
  const cookieValue = await getSessionCookie();

  await logoutSession({
    cookieValue,
    verifySessionCookie: (value: string, checkRevoked: boolean) => firebaseAdminAuth.verifySessionCookie(value, checkRevoked),
    revokeRefreshTokens: (uid: string) => firebaseAdminAuth.revokeRefreshTokens(uid),
    clearCookie: clearSessionCookie,
    revoke: true,
  });

  return { redirectTo: "/login" };
}

export async function getSessionUser(): Promise<AuthenticatedSessionResult> {
  const user = await resolveAuthenticatedUser();

  return { user };
}

