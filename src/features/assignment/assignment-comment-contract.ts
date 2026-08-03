import * as runtime from "./assignment-comment-contract.mjs";

export interface AssignmentComment {
  id: string;
  assignmentId: string;
  authorId: string;
  authorName: string;
  role: string;
  createdAt: number;
  editedAt: number | null;
  message: string;
  deleted: boolean;
  replyTo: string | null;
  canEdit: boolean;
  canDelete: boolean;
}

export interface RawAssignmentComment {
  assignment_id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  created_at: number;
  edited_at?: number | null;
  message: string;
  deleted: boolean;
  reply_to?: string | null;
  client_request_id: string;
}

export interface AssignmentCommentActor {
  uid: string;
  name: string;
  role: string;
}

export const ASSIGNMENT_COMMENT_LIMITS = runtime.ASSIGNMENT_COMMENT_LIMITS as {
  maximumMessageLength: number;
  pageSize: number;
  editWindowMs: number;
};
export const normalizeAssignmentCommentMessage = runtime.normalizeAssignmentCommentMessage as (
  value: unknown,
) => string | null;
export const canModifyAssignmentComment = runtime.canModifyAssignmentComment as (
  comment: RawAssignmentComment,
  actor: AssignmentCommentActor,
  now?: number,
) => boolean;
