export const ASSIGNMENT_COMMENT_LIMITS = Object.freeze({
  maximumMessageLength: 2000,
  pageSize: 30,
  editWindowMs: 15 * 60 * 1000,
});

const visibleContent = /[^\s\u200B-\u200D\u2060\uFEFF]/u;

export function normalizeAssignmentCommentMessage(value) {
  const message = typeof value === "string" ? value.trim() : "";
  if (!message || !visibleContent.test(message)) return null;
  if (message.length > ASSIGNMENT_COMMENT_LIMITS.maximumMessageLength) return null;
  return message;
}

export function canModifyAssignmentComment(comment, actor, now = Date.now()) {
  if (!comment || comment.deleted === true) return false;
  if (String(actor?.role ?? "").trim().toLowerCase() === "super_admin") return true;
  return (
    String(comment.author_id ?? "") === String(actor?.uid ?? "") &&
    now - Number(comment.created_at ?? 0) <= ASSIGNMENT_COMMENT_LIMITS.editWindowMs
  );
}
