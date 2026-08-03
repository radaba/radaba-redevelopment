import type {
  AssignmentListItem,
  RawAssignmentSnapshotEntry,
} from "@/features/assignment/assignment-types";
import type { AssignmentListQueryInput } from "@/features/assignment/assignment-query-contract";

export const ASSIGNMENT_RTDB_PATH = "assignment";

export interface AssignmentExportReadResult {
  rows: AssignmentListItem[];
  exceededLimit: boolean;
}

export const RELATED_ASSIGNMENT_DEFAULT_LIMIT = 20;
export const RELATED_ASSIGNMENT_MAXIMUM_LIMIT = 50;
export const RIGGER_ASSIGNMENT_DEFAULT_LIMIT = 20;
export const RIGGER_ASSIGNMENT_MAXIMUM_LIMIT = 50;
export const RIGGER_WORKLOAD_WINDOW_LIMIT = 1000;
export interface AssignmentRiggerIdentity { name:string; email:string }
export interface AssignmentBoundedRows { rows:AssignmentListItem[]; exceededLimit:boolean }

export interface AssignmentReadRepository {
  findByKey(key: string): Promise<RawAssignmentSnapshotEntry | null>;
  findByAssignmentId(assignmentId: string): Promise<RawAssignmentSnapshotEntry[]>;
  findRecentByTowerId(towerId: string, limit?: number): Promise<AssignmentListItem[]>;
  findRecentByRiggerIdentity(identity:AssignmentRiggerIdentity,limit?:number):Promise<AssignmentBoundedRows>;
  readBoundedRiggerWindow(maximumRows?:number):Promise<AssignmentBoundedRows>;
  list(input: AssignmentListQueryInput): Promise<AssignmentListItem[]>;
  readForExport(
    input: AssignmentListQueryInput,
    maximumRows: number,
  ): Promise<AssignmentExportReadResult>;
}
