import type { RawAssignmentSnapshotEntry } from "@/features/assignment/assignment-types";

export interface AssignmentMapReadResult {
  records: RawAssignmentSnapshotEntry[];
  exceededLimit: boolean;
}
export interface AssignmentMapRepository {
  readCreatedRange(startDate: string, endDate: string, maximum: number): Promise<AssignmentMapReadResult>;
}
