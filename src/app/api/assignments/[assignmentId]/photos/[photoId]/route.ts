import { NextResponse } from "next/server";
import { assignmentApiError } from "@/server/assignment/assignment-api";
import { resolveAssignmentActor } from "@/server/assignment/assignment-session";
import { AssignmentPhotoService } from "@/server/assignment/assignment-photo-service";
import { FirebaseAssignmentPhotoRepository } from "@/server/assignment/firebase-assignment-photo-repository";
import { FirebaseAssignmentCommandRepository } from "@/server/assignment/firebase-assignment-command-repository";
export async function DELETE(_request: Request, { params }: { params: Promise<{ assignmentId: string; photoId: string }> }) {
  try { const user = await resolveAssignmentActor(); const { assignmentId, photoId } = await params; await new AssignmentPhotoService(new FirebaseAssignmentCommandRepository(), new FirebaseAssignmentPhotoRepository()).remove(decodeURIComponent(assignmentId), decodeURIComponent(photoId), { uid: String(user.uid), name: String(user.name), email: String(user.email), role: String(user.role) }); return NextResponse.json({ success: true }, { headers: { "Cache-Control": "private, no-store" } }); } catch (error) { return assignmentApiError(error); }
}