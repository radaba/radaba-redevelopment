import "server-only";
import type { Database, DataSnapshot } from "firebase-admin/database";
import { firebaseAdminDatabase } from "@/lib/firebase/admin";
import {
  mapAdministratorAuditRecord,
  type AdministratorAuditViewRecord,
} from "@/features/admin/administrator-audit-center";
const PATH = "administrator_audit";
export class FirebaseAdministratorAuditReadRepository {
  constructor(private readonly database: Database = firebaseAdminDatabase) {}
  async list(): Promise<AdministratorAuditViewRecord[]> {
    const snapshot = await this.database.ref(PATH).once("value"),
      items: AdministratorAuditViewRecord[] = [];
    snapshot.forEach((child: DataSnapshot) => {
      items.push(mapAdministratorAuditRecord(child.key ?? "", child.val()));
    });
    return items;
  }
  async find(auditId: string) {
    if (!auditId || /[.#$\[\]/]/.test(auditId)) return null;
    const snapshot = await this.database.ref(PATH).child(auditId).once("value");
    return snapshot.exists()
      ? mapAdministratorAuditRecord(snapshot.key ?? auditId, snapshot.val())
      : null;
  }
}
