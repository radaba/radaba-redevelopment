import type { RawAssignmentSnapshotEntry } from "@/features/assignment/assignment-types";

export interface AssignmentDashboardActivity {
  type: "comment" | "photo";
  assignmentKey: string;
  assignmentId: string;
  actor: string;
  at: string | number;
  summary: string;
}
export interface AssignmentDashboardReadResult {
  records: RawAssignmentSnapshotEntry[];
  exceededLimit: boolean;
}
export interface AssignmentDashboardRepository {
  readCreatedRange(startDate: string, endDate: string, maximum: number): Promise<AssignmentDashboardReadResult>;
  readRecentActivity(assignments: readonly RawAssignmentSnapshotEntry[], maximum: number): Promise<AssignmentDashboardActivity[]>;
}
