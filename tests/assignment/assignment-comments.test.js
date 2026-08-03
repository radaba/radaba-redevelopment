import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  ASSIGNMENT_COMMENT_LIMITS,
  canModifyAssignmentComment,
  normalizeAssignmentCommentMessage,
} from "../../src/features/assignment/assignment-comment-contract.mjs";

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8");
const comment = (overrides = {}) => ({
  assignment_id: "A-1",
  author_id: "u-1",
  author_name: "John",
  author_role: "rigger",
  created_at: 1_000_000,
  message: "Ready",
  deleted: false,
  client_request_id: "00000000-0000-4000-8000-000000000001",
  ...overrides,
});

test("centralized comment validation trims text and rejects empty, invisible, and oversized input", () => {
  assert.equal(normalizeAssignmentCommentMessage("  Ready\n"), "Ready");
  for (const value of ["", "   ", "\u200b\u2060", null])
    assert.equal(normalizeAssignmentCommentMessage(value), null);
  assert.equal(
    normalizeAssignmentCommentMessage("x".repeat(ASSIGNMENT_COMMENT_LIMITS.maximumMessageLength + 1)),
    null,
  );
});

test("own recent comments and administrator comments can be modified", () => {
  assert.equal(canModifyAssignmentComment(comment(), { uid: "u-1", role: "rigger" }, 1_000_001), true);
  assert.equal(
    canModifyAssignmentComment(comment(), { uid: "u-1", role: "rigger" }, 1_000_000 + ASSIGNMENT_COMMENT_LIMITS.editWindowMs + 1),
    false,
  );
  assert.equal(canModifyAssignmentComment(comment(), { uid: "u-2", role: "rigger" }, 1_000_001), false);
  assert.equal(canModifyAssignmentComment(comment(), { uid: "admin", role: "super_admin" }, 9_000_000), true);
  assert.equal(canModifyAssignmentComment(comment({ deleted: true }), { uid: "admin", role: "super_admin" }, 9_000_000), false);
});

test("repository uses isolated push-key pagination, transactions, and soft deletion", async () => {
  const source = await read("src/server/assignment/firebase-assignment-comment-repository.ts");
  assert.match(source, /ASSIGNMENT_COMMENT_RTDB_PATH = "assignment_comment"/);
  assert.match(source, /orderByKey\(\)\.limitToLast/);
  assert.match(source, /endBefore\(beforeId\)/);
  assert.match(source, /client_request_id/);
  assert.match(source, /\.transaction\(/);
  assert.match(source, /message: "", deleted: true/);
  assert.doesNotMatch(source, /\.remove\(/);
});

test("service owns identity, completion checks, duplicate request handling, and stale mutation errors", async () => {
  const source = await read("src/server/assignment/assignment-comment-service.ts");
  assert.match(source, /author_id: actor\.uid/);
  assert.match(source, /author_name: actor\.name/);
  assert.match(source, /author_role: actor\.role/);
  assert.match(source, /created_at: this\.now\(\)/);
  assert.match(source, /isCompletedAssignment\(assignment\.value\)/);
  assert.match(source, /findByRequestId/);
  assert.match(source, /if \(existing\) return/);
  assert.match(source, /outcome === "missing"/);
  assert.match(source, /permission-denied/);
});

test("routes authorize before comment reads and mutations and expose bounded realtime updates", async () => {
  const collection = await read("src/app/api/assignments/[assignmentId]/comments/route.ts");
  const item = await read("src/app/api/assignments/[assignmentId]/comments/[commentId]/route.ts");
  const stream = await read("src/app/api/assignments/[assignmentId]/comments/stream/route.ts");
  assert.ok(collection.indexOf("resolveAssignmentActor") < collection.indexOf("service().list"));
  assert.ok(item.indexOf("resolveAssignmentActor") < item.indexOf("service().update"));
  assert.match(stream, /limitToLast\(ASSIGNMENT_COMMENT_LIMITS\.pageSize\)/);
  assert.match(stream, /query\.on\("child_added"/);
  assert.match(stream, /query\.on\("child_changed"/);
  assert.match(stream, /text\/event-stream/);
});

test("Discussion is accessible, mobile-friendly, scroll-aware, and completed read-only", async () => {
  const source = await read("src/components/assignment/assignment-discussion.tsx");
  const detail = await read("src/components/assignment/assignment-detail.tsx");
  assert.match(detail, /AssignmentDiscussion/);
  assert.match(source, /nearBottom/);
  assert.match(source, /scrollHeight - node\.scrollTop - node\.clientHeight/);
  assert.match(source, /Load older comments/);
  assert.match(source, /Shift\+Enter/);
  assert.match(source, /aria-live="polite"/);
  assert.match(source, /Discussion is read-only/);
  assert.match(source, /crypto\.randomUUID\(\)/);
  assert.doesNotMatch(source, /markdown|dangerouslySetInnerHTML|typing indicator|read receipt/i);
});

test("comments remain outside lifecycle and notification systems", async () => {
  const timeline = await read("src/features/assignment/assignment-timeline.mjs");
  const detail = await read("src/components/assignment/assignment-detail.tsx");
  assert.doesNotMatch(timeline, /comment|discussion/i);
  assert.match(detail, /<AssignmentTimeline events=\{timeline\}/);
});
