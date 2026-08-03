import { NextResponse } from "next/server";
import { assignmentApiError } from "@/server/assignment/assignment-api";
import { resolveAssignmentActor } from "@/server/assignment/assignment-session";
import { AssignmentPhotoService } from "@/server/assignment/assignment-photo-service";
import { FirebaseAssignmentPhotoRepository } from "@/server/assignment/firebase-assignment-photo-repository";
import { FirebaseAssignmentCommandRepository } from "@/server/assignment/firebase-assignment-command-repository";
export async function GET(request: Request, { params }: { params: Promise<{ assignmentId: string; photoId: string }> }) {
  try { await resolveAssignmentActor(); const { assignmentId, photoId } = await params; const variant = new URL(request.url).searchParams.get("variant"); const data = await new AssignmentPhotoService(new FirebaseAssignmentCommandRepository(), new FirebaseAssignmentPhotoRepository()).content(decodeURIComponent(assignmentId), decodeURIComponent(photoId), variant === "thumbnail"); return new NextResponse(new Uint8Array(data.bytes), { headers: { "Content-Type": data.mimeType, "Content-Disposition": `inline; filename="evidence-${photoId}"`, "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff" } }); } catch (error) { return assignmentApiError(error); }
}