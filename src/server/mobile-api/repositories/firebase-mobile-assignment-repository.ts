import "server-only";

import type { DataSnapshot, Database } from "firebase-admin/database";
import { firebaseAdminDatabase } from "@/lib/firebase/admin";
import { MOBILE_RTDB_PATHS } from "./mobile-repositories.mjs";

export type LegacyAssignmentRecord = Record<string, unknown>;

export interface MobileAssignmentReadRepository {
  findByAssignmentId(assignmentId: unknown): Promise<LegacyAssignmentRecord[]>;
}

export class FirebaseMobileAssignmentReadRepository
  implements MobileAssignmentReadRepository
{
  constructor(private readonly database: Database = firebaseAdminDatabase) {}

  async findByAssignmentId(assignmentId: unknown): Promise<LegacyAssignmentRecord[]> {
    const snapshot = await this.database
      .ref(MOBILE_RTDB_PATHS.assignment)
      .orderByChild("assignment_id")
      .equalTo(assignmentId as string | number | boolean | null)
      .once("value");
    return snapshotValues(snapshot);
  }
}

function snapshotValues(snapshot: DataSnapshot): LegacyAssignmentRecord[] {
  const values: LegacyAssignmentRecord[] = [];
  snapshot.forEach((child) => {
    values.push((child.val() ?? {}) as LegacyAssignmentRecord);
  });
  return values;
}
