import type { DataSnapshot } from "firebase-admin/database";
import { firebaseAdminDatabase } from "@/lib/firebase/admin";
import { ASSIGNMENT_COMMENT_LIMITS, canModifyAssignmentComment, type RawAssignmentComment } from "@/features/assignment/assignment-comment-contract";
import { resolveAssignmentActor } from "@/server/assignment/assignment-session";
import { FirebaseAssignmentCommandRepository } from "@/server/assignment/firebase-assignment-command-repository";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
  const user = await resolveAssignmentActor();
  const { assignmentId: encoded } = await params;
  const assignmentId = decodeURIComponent(encoded);
  const found = await new FirebaseAssignmentCommandRepository().findByAssignmentId(assignmentId);
  if (found.length !== 1) return new Response("Assignment not found.", { status: 404 });
  const actor = { uid: String(user.uid), name: String(user.name), role: String(user.role) };
  const encoder = new TextEncoder();
  const query = firebaseAdminDatabase.ref("assignment_comment").child(found[0].key).orderByKey().limitToLast(ASSIGNMENT_COMMENT_LIMITS.pageSize);
  let close: (() => void) | undefined;
  const stream = new ReadableStream({
    start(controller) {
      const send = (snapshot: DataSnapshot) => {
        const value = snapshot.val() as RawAssignmentComment;
        const now = Date.now();
        const canEdit = value.deleted !== true && value.author_id === actor.uid &&
          now - value.created_at <= ASSIGNMENT_COMMENT_LIMITS.editWindowMs;
        const canDelete = canModifyAssignmentComment(value, actor, now);
        const data = {
          id: snapshot.key ?? "", assignmentId: value.assignment_id, authorId: value.author_id,
          authorName: value.author_name, role: value.author_role, createdAt: value.created_at,
          editedAt: value.edited_at ?? null, message: value.message, deleted: value.deleted === true,
          replyTo: value.reply_to ?? null, canEdit,
          canDelete,
        };
        controller.enqueue(encoder.encode(`event: comment\ndata: ${JSON.stringify(data)}\n\n`));
      };
      const keepAlive = setInterval(() => controller.enqueue(encoder.encode(": keepalive\n\n")), 20000);
      query.on("child_added", send);
      query.on("child_changed", send);
      close = () => {
        clearInterval(keepAlive);
        query.off("child_added", send);
        query.off("child_changed", send);
      };
    },
    cancel() { close?.(); },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "private, no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
