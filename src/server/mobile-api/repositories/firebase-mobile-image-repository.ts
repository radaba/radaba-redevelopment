import "server-only";

import type { DataSnapshot, Database } from "firebase-admin/database";
import { firebaseAdminDatabase } from "@/lib/firebase/admin";
import { MOBILE_RTDB_PATHS } from "./mobile-repositories.mjs";

export type LegacyImageRecord = Record<string, unknown>;

export interface MobileImageReadRepository {
  findByAssignmentId(assignmentId: unknown): Promise<LegacyImageRecord[]>;
}

export class FirebaseMobileImageReadRepository implements MobileImageReadRepository {
  constructor(private readonly database: Database = firebaseAdminDatabase) {}

  async findByAssignmentId(assignmentId: unknown): Promise<LegacyImageRecord[]> {
    const snapshot = await this.database
      .ref(MOBILE_RTDB_PATHS.image)
      .orderByChild("assignment_id")
      .equalTo(assignmentId as string | number | boolean | null)
      .once("value");
    const values: LegacyImageRecord[] = [];
    snapshot.forEach((child: DataSnapshot) => {
      values.push((child.val() ?? {}) as LegacyImageRecord);
    });
    return values;
  }
}
