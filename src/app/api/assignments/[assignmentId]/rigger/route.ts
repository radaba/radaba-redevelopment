import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveAssignmentActor } from "@/server/assignment/assignment-session";
import { assignmentApiError } from "@/server/assignment/assignment-api";
import { FirebaseAssignmentCommandRepository } from "@/server/assignment/firebase-assignment-command-repository";
import { AssignmentCommandService } from "@/server/assignment/assignment-command-service";
import { FirebaseNotificationProducer } from "@/server/notification/firebase-notification-producer";
const scalar = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const schema = z
  .object({
    assignmentId: z.string().trim().min(1).max(240),
    riggerKey: z.string().trim().min(1).max(200),
    expected: z.record(z.string(), scalar),
  })
  .strict();
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ assignmentId: string }> },
) {
  try {
    const user = await resolveAssignmentActor();
    const body = schema.safeParse(await request.json().catch(() => null));
    if (!body.success)
      return NextResponse.json(
        { success: false, code: "invalid-input", error: "Invalid rigger input." },
        { status: 400 },
      );
    const { assignmentId: assignmentKeyParameter } = await params;
    let assignmentKey: string;
    try {
      assignmentKey = decodeURIComponent(assignmentKeyParameter);
    } catch {
      return NextResponse.json(
        {
          success: false,
          code: "invalid_assignment_key",
          error: "The Assignment reference is invalid.",
          ...(process.env.NODE_ENV === "development" ? { stage: "route_parameter" } : {}),
        },
        { status: 400 },
      );
    }
    if (process.env.NODE_ENV === "development")
      console.info("assignment_reassignment_trace", {
        requestUrl: request.url,
        requestRouteParameter: assignmentKeyParameter,
        commandAssignmentKey: assignmentKey,
      });
    const data = await new AssignmentCommandService(new FirebaseAssignmentCommandRepository(), undefined, new FirebaseNotificationProducer()).reassignRigger(
      {
        assignmentKey,
        assignmentId: body.data.assignmentId,
        riggerKey: body.data.riggerKey,
        expected: body.data.expected,
      },
      { uid: String(user.uid), name: String(user.name), email: String(user.email) },
    );
    return NextResponse.json(
      { success: true, data },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return assignmentApiError(e);
  }
}
