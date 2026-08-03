import {
  ASSIGNMENT_COMMENT_LIMITS,
  canModifyAssignmentComment,
  normalizeAssignmentCommentMessage,
  type AssignmentComment,
  type AssignmentCommentActor,
  type RawAssignmentComment,
} from "@/features/assignment/assignment-comment-contract";
import { isCompletedAssignment } from "@/features/assignment/assignment-command-contract";
import type { AssignmentCommandRepository } from "./assignment-command-repository";
import { AssignmentCommandError } from "./assignment-command-errors";
import type { AssignmentCommentRepository, StoredAssignmentComment } from "./assignment-comment-repository";

const requestIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class AssignmentCommentService {
  constructor(
    private readonly assignments: AssignmentCommandRepository,
    private readonly comments: AssignmentCommentRepository,
    private readonly now = () => Date.now(),
  ) {}
  private async assignment(assignmentId: string) {
    const found = await this.assignments.findByAssignmentId(assignmentId.trim());
    if (found.length !== 1) throw new AssignmentCommandError(found.length ? "stale-record" : "assignment-not-found", found.length ? "Assignment identity is ambiguous." : "Assignment was not found.");
    return found[0];
  }
  private view(stored: StoredAssignmentComment, actor: AssignmentCommentActor): AssignmentComment {
    const now = this.now();
    const canEdit = stored.value.deleted !== true &&
      stored.value.author_id === actor.uid &&
      now - stored.value.created_at <= ASSIGNMENT_COMMENT_LIMITS.editWindowMs;
    const canDelete = canModifyAssignmentComment(stored.value, actor, now);
    return {
      id: stored.id, assignmentId: stored.value.assignment_id, authorId: stored.value.author_id,
      authorName: stored.value.author_name, role: stored.value.author_role,
      createdAt: stored.value.created_at, editedAt: stored.value.edited_at ?? null,
      message: stored.value.message, deleted: stored.value.deleted === true,
      replyTo: stored.value.reply_to ?? null,
      canEdit, canDelete,
    };
  }
  async list(assignmentId: string, actor: AssignmentCommentActor, before?: string | null) {
    const assignment = await this.assignment(assignmentId);
    const rows = before
      ? await this.comments.listBefore(assignment.key, before, ASSIGNMENT_COMMENT_LIMITS.pageSize)
      : await this.comments.listNewest(assignment.key, ASSIGNMENT_COMMENT_LIMITS.pageSize);
    return { comments: rows.map((row) => this.view(row, actor)), nextCursor: rows.length === ASSIGNMENT_COMMENT_LIMITS.pageSize ? rows[0].id : null };
  }
  async create(assignmentId: string, input: { message: unknown; clientRequestId: unknown }, actor: AssignmentCommentActor) {
    const assignment = await this.assignment(assignmentId);
    if (isCompletedAssignment(assignment.value)) throw new AssignmentCommandError("ASSIGNMENT_COMPLETED", "Completed Assignment discussion is read-only.");
    const message = normalizeAssignmentCommentMessage(input.message);
    if (!message) throw new AssignmentCommandError("invalid-input", "Enter a visible comment of 2,000 characters or fewer.");
    const requestId = typeof input.clientRequestId === "string" ? input.clientRequestId : "";
    if (!requestIdPattern.test(requestId)) throw new AssignmentCommandError("invalid-input", "A valid request identifier is required.");
    const existing = await this.comments.findByRequestId(assignment.key, requestId);
    if (existing) return this.view(existing, actor);
    const id = this.comments.reserveKey(assignment.key);
    const value: RawAssignmentComment = {
      assignment_id: assignmentId, author_id: actor.uid, author_name: actor.name,
      author_role: actor.role, created_at: this.now(), message, deleted: false,
      client_request_id: requestId,
    };
    await this.comments.create(assignment.key, id, value);
    return this.view({ id, value }, actor);
  }
  async update(assignmentId: string, commentId: string, messageValue: unknown, actor: AssignmentCommentActor) {
    const assignment = await this.assignment(assignmentId);
    if (isCompletedAssignment(assignment.value)) throw new AssignmentCommandError("ASSIGNMENT_COMPLETED", "Completed Assignment discussion is read-only.");
    const message = normalizeAssignmentCommentMessage(messageValue);
    if (!message) throw new AssignmentCommandError("invalid-input", "Enter a visible comment of 2,000 characters or fewer.");
    const outcome = await this.comments.update(assignment.key, commentId, actor, message, this.now());
    if (outcome === "missing") throw new AssignmentCommandError("assignment-not-found", "Comment was not found.");
    if (outcome === "denied") throw new AssignmentCommandError("permission-denied", "This comment can no longer be edited.");
  }
  async remove(assignmentId: string, commentId: string, actor: AssignmentCommentActor) {
    const assignment = await this.assignment(assignmentId);
    if (isCompletedAssignment(assignment.value)) throw new AssignmentCommandError("ASSIGNMENT_COMPLETED", "Completed Assignment discussion is read-only.");
    const outcome = await this.comments.remove(assignment.key, commentId, actor, this.now());
    if (outcome === "missing") throw new AssignmentCommandError("assignment-not-found", "Comment was not found.");
    if (outcome === "denied") throw new AssignmentCommandError("permission-denied", "This comment can no longer be deleted.");
  }
}
