import "server-only";
import type { DataSnapshot, Database } from "firebase-admin/database";
import { firebaseAdminDatabase } from "@/lib/firebase/admin";
import { MOBILE_RTDB_PATHS } from "./mobile-repositories.mjs";

const values = (snapshot: DataSnapshot) => { const rows: Record<string, unknown>[] = []; snapshot.forEach((child) => { rows[rows.length] = (child.val() ?? {}) as Record<string, unknown>; }); return rows; };

export class FirebaseMobileAuthProfileRepository {
  constructor(private readonly database: Database = firebaseAdminDatabase) {}
  async findUsersByEmail(email: unknown) { return values(await this.database.ref(MOBILE_RTDB_PATHS.user).orderByChild("email").equalTo(email as string).once("value")); }
  async listPrivileges() { return values(await this.database.ref(MOBILE_RTDB_PATHS.privilege).orderByChild("category").once("value")); }
  async writeLoginLog(record: Record<string, unknown>) { await this.database.ref(MOBILE_RTDB_PATHS.log).push(record); }
  async updateUsersByEmail(email: unknown, body: Record<string, unknown>) {
    const snapshot = await this.database.ref(MOBILE_RTDB_PATHS.user).orderByChild("email").equalTo(email as string).once("value");
    const writes: Promise<void>[] = [];
    snapshot.forEach((child) => { writes[writes.length] = this.database.ref(`${MOBILE_RTDB_PATHS.user}/${child.key}`).update(body); });
    await Promise.all(writes); return writes.length;
  }
}
