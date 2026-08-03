import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveAssignmentActor } from "@/server/assignment/assignment-session";
import { assignmentApiError } from "@/server/assignment/assignment-api";
import { FirebaseAssignmentCommandRepository } from "@/server/assignment/firebase-assignment-command-repository";
import { FirebaseAssignmentCommentRepository } from "@/server/assignment/firebase-assignment-comment-repository";
import { AssignmentCommentService } from "@/server/assignment/assignment-comment-service";

const createSchema = z.object({
  message: z.string(),
  clientRequestId: z.string(),
}).strict();
const actor = (user: Awaited<ReturnType<typeof resolveAssignmentActor>>) => ({
  uid: String(user.uid), name: String(user.name), role: String(user.role),
});
const service = () => new AssignmentCommentService(
  new FirebaseAssignmentCommandRepository(),
  new FirebaseAssignmentCommentRepository(),
);

export async function GET(request: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
  try {
    const user = await resolveAssignmentActor();
    const { assignmentId } = await params;
    const before = new URL(request.url).searchParams.get("before");
    const data = await service().list(decodeURIComponent(assignmentId), actor(user), before);
    return NextResponse.json({ success: true, data }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return assignmentApiError(error); }
}

export async function POST(request: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
  try {
    const user = await resolveAssignmentActor();
    const parsed = createSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, code: "invalid-input", error: "Invalid comment input." }, { status: 400 });
    const { assignmentId } = await params;
    const data = await service().create(decodeURIComponent(assignmentId), parsed.data, actor(user));
    return NextResponse.json({ success: true, data }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return assignmentApiError(error); }
}
