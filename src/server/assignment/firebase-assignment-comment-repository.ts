import "server-only";
import type { DataSnapshot, Database } from "firebase-admin/database";
import { firebaseAdminDatabase } from "@/lib/firebase/admin";
import {
  ASSIGNMENT_COMMENT_LIMITS,
  canModifyAssignmentComment,
  type AssignmentCommentActor,
  type RawAssignmentComment,
} from "@/features/assignment/assignment-comment-contract";
import type {
  AssignmentCommentRepository,
  StoredAssignmentComment,
} from "./assignment-comment-repository";

export const ASSIGNMENT_COMMENT_RTDB_PATH = "assignment_comment";

function comments(snapshot: DataSnapshot): StoredAssignmentComment[] {
  const result: StoredAssignmentComment[] = [];
  snapshot.forEach((child) => {
    result.push({ id: child.key ?? "", value: child.val() as RawAssignmentComment });
  });
  return result;
}

export class FirebaseAssignmentCommentRepository implements AssignmentCommentRepository {
  constructor(private readonly database: Database = firebaseAdminDatabase) {}
  private thread(key: string) { return this.database.ref(ASSIGNMENT_COMMENT_RTDB_PATH).child(key); }
  reserveKey(assignmentKey: string) {
    const key = this.thread(assignmentKey).push().key;
    if (!key) throw new Error("Could not reserve comment key.");
    return key;
  }
  async listNewest(assignmentKey: string, limit: number) {
    return comments(await this.thread(assignmentKey).orderByKey().limitToLast(limit).once("value"));
  }
  async listBefore(assignmentKey: string, beforeId: string, limit: number) {
    return comments(await this.thread(assignmentKey).orderByKey().endBefore(beforeId).limitToLast(limit).once("value"));
  }
  async findByRequestId(assignmentKey: string, requestId: string) {
    const snapshot = await this.thread(assignmentKey).orderByChild("client_request_id").equalTo(requestId).limitToFirst(1).once("value");
    return comments(snapshot)[0] ?? null;
  }
  async create(assignmentKey: string, commentId: string, value: RawAssignmentComment) {
    await this.thread(assignmentKey).child(commentId).transaction((current) => current ?? value, undefined, false);
  }
  async update(assignmentKey: string, commentId: string, actor: AssignmentCommentActor, message: string, now: number) {
    let outcome: "updated" | "missing" | "denied" = "missing";
    const result = await this.thread(assignmentKey).child(commentId).transaction((current) => {
      if (!current) return;
      const ownRecent = current.deleted !== true &&
        String(current.author_id ?? "") === actor.uid &&
        now - Number(current.created_at ?? 0) <= ASSIGNMENT_COMMENT_LIMITS.editWindowMs;
      if (!ownRecent) { outcome = "denied"; return; }
      outcome = "updated";
      return { ...current, message, edited_at: now };
    }, undefined, false);
    return result.committed ? "updated" : outcome;
  }
  async remove(assignmentKey: string, commentId: string, actor: AssignmentCommentActor, now: number) {
    let outcome: "deleted" | "missing" | "denied" = "missing";
    const result = await this.thread(assignmentKey).child(commentId).transaction((current) => {
      if (!current) return;
      if (!canModifyAssignmentComment(current, actor, now)) { outcome = "denied"; return; }
      outcome = "deleted";
      return { ...current, message: "", deleted: true, edited_at: now };
    }, undefined, false);
    return result.committed ? "deleted" : outcome;
  }
}
