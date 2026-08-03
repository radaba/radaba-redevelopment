import "server-only";

import type { DataSnapshot, Database } from "firebase-admin/database";
import { firebaseAdminDatabase } from "@/lib/firebase/admin";
import { MOBILE_RTDB_PATHS } from "./mobile-repositories.mjs";

export type LegacyCellRecord = Record<string, unknown>;

export interface MobileCellRepository {
  findByAssignmentId(assignmentId: unknown): Promise<LegacyCellRecord[]>;
  findByRcellId(rcellId: unknown): Promise<LegacyCellRecord[]>;
}

export class FirebaseMobileCellRepository implements MobileCellRepository {
  constructor(private readonly database: Database = firebaseAdminDatabase) {}

  async findByAssignmentId(assignmentId: unknown): Promise<LegacyCellRecord[]> {
    const snapshot = await this.database
      .ref(MOBILE_RTDB_PATHS.cell)
      .orderByChild("assignment_id")
      .equalTo(assignmentId as string | number | boolean | null)
      .once("value");
    const records: LegacyCellRecord[] = [];
    snapshot.forEach((child: DataSnapshot) => {
      records[records.length] = (child.val() ?? {}) as LegacyCellRecord;
    });
    return records;
  }

  async findByRcellId(rcellId: unknown): Promise<LegacyCellRecord[]> {
    const snapshot = await this.database
      .ref(MOBILE_RTDB_PATHS.cell)
      .orderByChild("rcell_id")
      .equalTo(rcellId as string | number | boolean | null)
      .once("value");
    const records: LegacyCellRecord[] = [];
    snapshot.forEach((child: DataSnapshot) => {
      records[records.length] = (child.val() ?? {}) as LegacyCellRecord;
    });
    return records;
  }
}
