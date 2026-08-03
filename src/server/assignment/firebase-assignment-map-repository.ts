import "server-only";
import type { DataSnapshot, Database } from "firebase-admin/database";
import { firebaseAdminDatabase } from "@/lib/firebase/admin";
import type { RawAssignmentRecord, RawAssignmentSnapshotEntry } from "@/features/assignment/assignment-types";
import type { AssignmentMapReadResult, AssignmentMapRepository } from "./assignment-map-repository";

function entries(snapshot: DataSnapshot): RawAssignmentSnapshotEntry[] {
  const result: RawAssignmentSnapshotEntry[] = [];
  snapshot.forEach((child) => {
    result.push({ key: child.key ?? "", value: (child.val() ?? {}) as RawAssignmentRecord });
  });
  return result;
}

export class FirebaseAssignmentMapRepository implements AssignmentMapRepository {
  constructor(private readonly database: Database = firebaseAdminDatabase) {}
  async readCreatedRange(startDate: string, endDate: string, maximum: number): Promise<AssignmentMapReadResult> {
    const snapshot = await this.database.ref("assignment")
      .orderByChild("created_date")
      .startAt(startDate)
      .endAt(endDate)
      .limitToLast(maximum + 1)
      .once("value");
    const records = entries(snapshot);
    return { records: records.slice(-maximum), exceededLimit: records.length > maximum };
  }
}
