import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveAssignmentActor } from "@/server/assignment/assignment-session";
import { assignmentApiError } from "@/server/assignment/assignment-api";
import { FirebaseAssignmentCommandRepository } from "@/server/assignment/firebase-assignment-command-repository";
import { AssignmentCommandService } from "@/server/assignment/assignment-command-service";
import { FirebaseNotificationProducer } from "@/server/notification/firebase-notification-producer";

const schema = z.object({ reason: z.string().trim().min(1).max(2000) }).strict();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ assignmentId: string }> },
) {
  try {
    const actor = await resolveAssignmentActor();
    const body = schema.safeParse(await request.json().catch(() => null));
    if (!body.success)
      return NextResponse.json(
        {
          success: false,
          code: "invalid-input",
          error: "A revisit reason is required and must be 2,000 characters or fewer.",
        },
        { status: 400 },
      );
    const { assignmentId } = await params;
    const data = await new AssignmentCommandService(new FirebaseAssignmentCommandRepository(), undefined, new FirebaseNotificationProducer()).revisitAssignment(decodeURIComponent(assignmentId), body.data.reason, {
      uid: actor.uid,
      name: actor.name,
    });
    return NextResponse.json(
      { success: true, data },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return assignmentApiError(error);
  }
}
