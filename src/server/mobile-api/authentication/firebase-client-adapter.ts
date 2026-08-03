import "server-only";
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";

export class FirebaseMobileClientAuthentication {
  async signIn(email: string, password: string) { const credential = await signInWithEmailAndPassword(firebaseAuth, email, password); return { token: await credential.user.getIdToken() }; }
  async sendPasswordReset(email: string) { await sendPasswordResetEmail(firebaseAuth, email); }
}
