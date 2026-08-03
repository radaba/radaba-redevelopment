import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveAssignmentActor } from "@/server/assignment/assignment-session";
import { assignmentApiError } from "@/server/assignment/assignment-api";
import { FirebaseAssignmentCommandRepository } from "@/server/assignment/firebase-assignment-command-repository";
import { FirebaseAssignmentCommentRepository } from "@/server/assignment/firebase-assignment-comment-repository";
import { AssignmentCommentService } from "@/server/assignment/assignment-comment-service";

const schema = z.object({ message: z.string() }).strict();
const actor = (user: Awaited<ReturnType<typeof resolveAssignmentActor>>) => ({
  uid: String(user.uid), name: String(user.name), role: String(user.role),
});
const service = () => new AssignmentCommentService(new FirebaseAssignmentCommandRepository(), new FirebaseAssignmentCommentRepository());

export async function PATCH(request: Request, { params }: { params: Promise<{ assignmentId: string; commentId: string }> }) {
  try {
    const user = await resolveAssignmentActor();
    const body = schema.safeParse(await request.json().catch(() => null));
    if (!body.success) return NextResponse.json({ success: false, code: "invalid-input", error: "Invalid comment input." }, { status: 400 });
    const { assignmentId, commentId } = await params;
    await service().update(decodeURIComponent(assignmentId), decodeURIComponent(commentId), body.data.message, actor(user));
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return assignmentApiError(error); }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ assignmentId: string; commentId: string }> }) {
  try {
    const user = await resolveAssignmentActor();
    const { assignmentId, commentId } = await params;
    await service().remove(decodeURIComponent(assignmentId), decodeURIComponent(commentId), actor(user));
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return assignmentApiError(error); }
}
