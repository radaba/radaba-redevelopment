import type {
  RawAssignmentRecord,
  RawAssignmentSnapshotEntry,
} from "@/features/assignment/assignment-types";
import type {
  AssignmentReference,
  AssignmentRevisitEvent,
  ResolvedAssignmentUser,
} from "@/features/assignment/assignment-command-contract";
import type { AssignmentTransitionAction } from "@/features/assignment/assignment-workflow";
import type {
  AssignmentChecklistUpdate,
  AssignmentExecutionActor,
  AssignmentWorkReportUpdate,
} from "@/features/assignment/assignment-execution-contract";
export interface ResolvedTower {
  key: string;
  record: RawAssignmentRecord;
}
export interface AssignmentCommandRepository {
  findByKey(key: string): Promise<RawAssignmentSnapshotEntry | null>;
  findTower(key: string): Promise<ResolvedTower | null>;
  findTowerByTowerId(towerId: string): Promise<ResolvedTower | null>;
  findUser(key: string): Promise<ResolvedAssignmentUser | null>;
  findUserByEmail(email: string): Promise<ResolvedAssignmentUser | null>;
  findCategory(name: string): Promise<AssignmentReference | null>;
  findByAssignmentId(assignmentId: string): Promise<RawAssignmentSnapshotEntry[]>;
  findByTowerId(towerId: string): Promise<RawAssignmentSnapshotEntry[]>;
  reserveAssignmentKey(): string;
  reserveRevisitKey(assignmentKey: string): string;
  createAssignment(key: string, record: RawAssignmentRecord): Promise<void>;
  createAssignments(records: Record<string, RawAssignmentRecord>): Promise<void>;
  revisitAssignment(
    key: string,
    eventKey: string,
    event: AssignmentRevisitEvent,
  ): Promise<
    | { outcome: "updated"; revisitCount: number }
    | { outcome: "not-completed" }
    | { outcome: "missing" }
  >;
  updateRiggerIfMutable(
    key: string,
    rigger: { name: string; email: string },
  ): Promise<"updated" | "unchanged" | "completed" | "missing">;
  reassignRiggerByKey(input: {
    assignmentKey: string;
    assignmentId: string;
    expected: Record<string, unknown>;
    rigger: ResolvedAssignmentUser;
    actor: { uid: string; name: string; email: string };
    occurredAt: string;
  }): Promise<{
    outcome:
      | "updated"
      | "unchanged"
      | "missing"
      | "changed"
      | "completed"
      | "dependent-failed"
      | "transaction-conflict";
    imageCount?: number;
    cellCount?: number;
    transactionSnapshotExists?: boolean;
    transactionCommitted?: boolean;
  }>;
  transitionAssignment(
    key: string,
    action: AssignmentTransitionAction,
    timestamp: { date: string; datetime: string },
    actor: { uid: string; name: string },
  ): Promise<"updated" | "invalid-transition" | "missing">;
  updateChecklist(
    key: string,
    input: AssignmentChecklistUpdate,
    actor: AssignmentExecutionActor,
    timestamp: string,
  ): Promise<"updated" | "completed" | "permission-denied" | "stale-revision" | "missing">;
  updateWorkReport(
    key: string,
    input: AssignmentWorkReportUpdate,
    actor: AssignmentExecutionActor,
    timestamp: string,
  ): Promise<"updated" | "completed" | "permission-denied" | "stale-revision" | "missing">;
  listTowers(search: string, limit: number): Promise<AssignmentReference[]>;
  listUsers(
    search: string,
    kind: "rno" | "rigger" | "coordinator",
    limit: number,
  ): Promise<AssignmentReference[]>;
  listCategories(): Promise<AssignmentReference[]>;
}
