import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { enableInMemoryPersistence, firebaseAuth } from "@/lib/firebase/client";
import { requestPasswordReset, shortSafeHash } from "@/features/authentication/password-reset.mjs";

export interface AuthApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface LoginRequestBody {
  idToken: string;
}

async function parseApiResponse<T>(response: Response): Promise<AuthApiResponse<T>> {
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : { success: false, error: "Unexpected response from server." };

  if (!response.ok) {
    return {
      success: false,
      error: payload?.error ?? "Authentication request failed.",
    };
  }

  return {
    success: true,
    data: payload?.data,
  };
}

export async function loginWithEmailAndPassword(email: string, password: string) {
  try {
    await enableInMemoryPersistence();
    const credential = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);

    try {
      const body: LoginRequestBody = { idToken: await credential.user.getIdToken() };
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      return parseApiResponse<{ redirectTo?: string }>(response);
    } finally {
      await signOut(firebaseAuth);
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to sign in.",
    };
  }
}

export async function resetPassword(email: string) {
  return requestPasswordReset({
    auth: firebaseAuth,
    email,
    send: sendPasswordResetEmail,
    log: ({ outcome }: { outcome: string }) => {
      if (process.env.NODE_ENV !== "production") {
        const options = firebaseAuth.app.options;
        console.info("password_reset_diagnostic", {
          outcome,
          appName: firebaseAuth.app.name,
          projectIdHash: shortSafeHash(options.projectId),
          authDomainHash: shortSafeHash(options.authDomain),
          apiKeyHash: shortSafeHash(options.apiKey),
          emulator: Boolean(firebaseAuth.emulatorConfig),
          origin: typeof window === "undefined" ? "server" : window.location.origin,
          actionCodeSettings: "default_firebase_handler",
        });
      }
    },
  });
}
const passwordError = (error: unknown) => {
  const code =
    typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  if (/invalid-credential|wrong-password/.test(code)) return "Current password is incorrect.";
  if (/weak-password/.test(code)) return "New password is too weak.";
  if (/requires-recent-login/.test(code))
    return "Please sign in again before changing your password.";
  if (/too-many-requests/.test(code)) return "Too many attempts. Please wait and try again.";
  if (/network-request-failed/.test(code))
    return "Network error. Check your connection and try again.";
  if (/user-not-found|user-disabled/.test(code))
    return "Your account is unavailable. Please sign in again.";
  return "Unable to change password. Please try again.";
};

export async function changeCurrentUserPassword(
  email: string,
  currentPassword: string,
  newPassword: string,
) {
  try {
    await enableInMemoryPersistence();
    const signIn = await signInWithEmailAndPassword(firebaseAuth, email, currentPassword);
    try {
      const credential = EmailAuthProvider.credential(email, currentPassword);
      await reauthenticateWithCredential(signIn.user, credential);
      await updatePassword(signIn.user, newPassword);
      const idToken = await signIn.user.getIdToken(true);
      const session = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      return session.ok
        ? { success: true }
        : {
            success: true,
            warning: "Password changed successfully. Please sign in again to refresh your session.",
          };
    } finally {
      await signOut(firebaseAuth);
    }
  } catch (error) {
    return { success: false, error: passwordError(error) };
  }
}
