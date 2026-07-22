import { firebaseAdminAuth, firebaseAdminDatabase } from "@/lib/firebase/admin";
import { buildLegacyUserSessionPayload } from "@/lib/auth/compat";
import { signInWithEmailAndPasswordOnServer } from "@/lib/firebase/server";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ResetPayload {
  email: string;
}

export async function signInWithEmailAndPassword(payload: LoginPayload) {
  const email = payload.email?.trim().toLowerCase();
  const password = payload.password;

  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  const credential = await signInWithEmailAndPasswordOnServer(email, password);
  const userRecord = await firebaseAdminAuth.getUser(credential.user.uid);

  const userSnapshot = await firebaseAdminDatabase
    .ref("user")
    .orderByChild("email")
    .equalTo(email)
    .once("value");
  const userNode = userSnapshot.val();

  if (!userNode) {
    throw new Error("User not found.");
  }

  const userEntry = Object.values(userNode as Record<string, unknown>)[0] as Record<string, unknown>;
  const role = String(userEntry.role ?? "");
  const status = String(userEntry.status ?? "");

  if (status.toLowerCase() === "not active") {
    throw new Error("User is not active.");
  }

  const privilegeSnapshot = await firebaseAdminDatabase
    .ref("privilege")
    .child(role)
    .once("value");
  const privilege = privilegeSnapshot.val();

  const sessionCookie = credential.user.uid ?? userRecord.uid;

  return {
    user: buildLegacyUserSessionPayload(
      {
        ...userEntry,
        email,
        uid: userRecord.uid,
        role,
        status,
      },
      privilege,
    ),
    session: credential,
    sessionCookie,
  };
}

export async function sendPasswordResetEmail(payload: ResetPayload) {
  const email = payload.email?.trim().toLowerCase();

  if (!email) {
    throw new Error("Email is required.");
  }

  await firebaseAdminAuth.generatePasswordResetLink(email);

  return { success: true };
}
