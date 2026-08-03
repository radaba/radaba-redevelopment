import { NextResponse } from "next/server";
import { z } from "zod";
import { assignmentApiError } from "@/server/assignment/assignment-api";
import { AssignmentCommandService } from "@/server/assignment/assignment-command-service";
import { FirebaseNotificationProducer } from "@/server/notification/firebase-notification-producer";
import { FirebaseAssignmentCommandRepository } from "@/server/assignment/firebase-assignment-command-repository";
import { resolveAssignmentActor } from "@/server/assignment/assignment-session";

const schema = z
  .object({ action: z.enum(["accept", "start", "resume", "complete", "pause"]) })
  .strict();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ assignmentId: string }> },
) {
  try {
    const actor = await resolveAssignmentActor();
    const body = schema.safeParse(await request.json().catch(() => null));
    if (!body.success)
      return NextResponse.json(
        { success: false, code: "invalid-input", error: "Invalid workflow action." },
        { status: 400 },
      );
    const { assignmentId } = await params;
    const data = await new AssignmentCommandService(new FirebaseAssignmentCommandRepository(), undefined, new FirebaseNotificationProducer()).transitionAssignment(decodeURIComponent(assignmentId), body.data.action, {
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
