import "server-only";

import type { Auth } from "firebase-admin/auth";
import { firebaseAdminAuth } from "@/lib/firebase/admin";

export class FirebaseMobileTokenVerifier {
  constructor(private readonly authentication: Auth = firebaseAdminAuth) {}

  async verify(token: string) {
    return this.authentication.verifyIdToken(token, true);
  }

  async revoke(uid: string) {
    await this.authentication.revokeRefreshTokens(uid);
  }
}
