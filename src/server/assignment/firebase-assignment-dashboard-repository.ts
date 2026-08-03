import "server-only";
import type { DataSnapshot, Database } from "firebase-admin/database";
import { firebaseAdminDatabase } from "@/lib/firebase/admin";
import type { RawAssignmentRecord, RawAssignmentSnapshotEntry } from "@/features/assignment/assignment-types";
import type {
  AssignmentDashboardActivity,
  AssignmentDashboardReadResult,
  AssignmentDashboardRepository,
} from "./assignment-dashboard-repository";

const entries = (snapshot: DataSnapshot) => {
  const result: RawAssignmentSnapshotEntry[] = [];
  snapshot.forEach((child) => { result.push({ key: child.key ?? "", value: child.val() as RawAssignmentRecord }); });
  return result;
};
const text = (value: unknown) => String(value ?? "").trim();

export class FirebaseAssignmentDashboardRepository implements AssignmentDashboardRepository {
  constructor(private readonly database: Database = firebaseAdminDatabase) {}
  async readCreatedRange(startDate: string, endDate: string, maximum: number): Promise<AssignmentDashboardReadResult> {
    const snapshot = await this.database.ref("assignment")
      .orderByChild("created_date").startAt(startDate).endAt(endDate)
      .limitToLast(maximum + 1).once("value");
    const records = entries(snapshot);
    return { records: records.slice(-maximum), exceededLimit: records.length > maximum };
  }
  async readRecentActivity(assignments: readonly RawAssignmentSnapshotEntry[], maximum: number) {
    const candidates = [...assignments]
      .sort((a, b) => text(b.value.created_datetime).localeCompare(text(a.value.created_datetime)) || a.key.localeCompare(b.key))
      .slice(0, 12);
    const rows = await Promise.all(candidates.flatMap((assignment) => [
      this.latestComment(assignment),
      this.latestPhoto(assignment),
    ]));
    return rows.filter((item): item is AssignmentDashboardActivity => Boolean(item))
      .sort((a, b) => String(b.at).localeCompare(String(a.at)) || a.assignmentKey.localeCompare(b.assignmentKey) || a.type.localeCompare(b.type)).slice(0, maximum);
  }
  private async latestComment(assignment: RawAssignmentSnapshotEntry): Promise<AssignmentDashboardActivity | null> {
    const snapshot = await this.database.ref("assignment_comment").child(assignment.key).orderByKey().limitToLast(1).once("value");
    let row: AssignmentDashboardActivity | null = null;
    snapshot.forEach((child) => {
      const value = child.val() as Record<string, unknown>;
      row = {
        type: "comment", assignmentKey: assignment.key,
        assignmentId: text(assignment.value.assignment_id) || assignment.key,
        actor: text(value.author_name) || "Unknown user", at: Number(value.created_at ?? 0),
        summary: value.deleted === true ? "Comment deleted" : text(value.message).slice(0, 120),
      };
    });
    return row;
  }
  private async latestPhoto(assignment: RawAssignmentSnapshotEntry): Promise<AssignmentDashboardActivity | null> {
    const snapshot = await this.database.ref("assignment_photo").child(assignment.key).orderByKey().limitToLast(1).once("value");
    let row: AssignmentDashboardActivity | null = null;
    snapshot.forEach((child) => {
      const value = child.val() as Record<string, unknown>;
      row = {
        type: "photo", assignmentKey: assignment.key,
        assignmentId: text(assignment.value.assignment_id) || assignment.key,
        actor: text(value.uploaded_by_name) || "Unknown user", at: text(value.uploaded_at),
        summary: text(value.original_filename) || "Photo evidence uploaded",
      };
    });
    return row;
  }
}
