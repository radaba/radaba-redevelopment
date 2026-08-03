import type { RawAssignmentComment, AssignmentCommentActor } from "@/features/assignment/assignment-comment-contract";

export interface StoredAssignmentComment { id: string; value: RawAssignmentComment; }
export interface AssignmentCommentRepository {
  reserveKey(assignmentKey: string): string;
  listNewest(assignmentKey: string, limit: number): Promise<StoredAssignmentComment[]>;
  listBefore(assignmentKey: string, beforeId: string, limit: number): Promise<StoredAssignmentComment[]>;
  findByRequestId(assignmentKey: string, requestId: string): Promise<StoredAssignmentComment | null>;
  create(assignmentKey: string, commentId: string, value: RawAssignmentComment): Promise<void>;
  update(assignmentKey: string, commentId: string, actor: AssignmentCommentActor, message: string, now: number): Promise<"updated" | "missing" | "denied">;
  remove(assignmentKey: string, commentId: string, actor: AssignmentCommentActor, now: number): Promise<"deleted" | "missing" | "denied">;
}
