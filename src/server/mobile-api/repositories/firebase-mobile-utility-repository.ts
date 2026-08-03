import "server-only";

import type { DataSnapshot, Database } from "firebase-admin/database";
import { firebaseAdminDatabase } from "@/lib/firebase/admin";
import { MOBILE_RTDB_PATHS } from "./mobile-repositories.mjs";

export type LegacyUtilityRecord = Record<string, unknown>;

export interface MobileUtilityReadRepository {
  listByKey(): Promise<LegacyUtilityRecord[]>;
}

export class FirebaseMobileUtilityReadRepository implements MobileUtilityReadRepository {
  constructor(private readonly database: Database = firebaseAdminDatabase) {}

  async listByKey(): Promise<LegacyUtilityRecord[]> {
    const snapshot = await this.database
      .ref(MOBILE_RTDB_PATHS.utility)
      .orderByKey()
      .once("value");
    const records: LegacyUtilityRecord[] = [];
    snapshot.forEach((child: DataSnapshot) => {
      records[records.length] = (child.val() ?? {}) as LegacyUtilityRecord;
    });
    return records;
  }
}
