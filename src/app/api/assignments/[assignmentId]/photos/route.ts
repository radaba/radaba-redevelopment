import { NextResponse } from "next/server";
import { assignmentApiError } from "@/server/assignment/assignment-api";
import { resolveAssignmentActor } from "@/server/assignment/assignment-session";
import { AssignmentPhotoService } from "@/server/assignment/assignment-photo-service";
import { FirebaseAssignmentPhotoRepository } from "@/server/assignment/firebase-assignment-photo-repository";
import { FirebaseAssignmentCommandRepository } from "@/server/assignment/firebase-assignment-command-repository";
const service = () => new AssignmentPhotoService(new FirebaseAssignmentCommandRepository(), new FirebaseAssignmentPhotoRepository());
const actor = (user: Awaited<ReturnType<typeof resolveAssignmentActor>>) => ({ uid: String(user.uid), name: String(user.name), email: String(user.email), role: String(user.role) });
export async function GET(_request: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
  try { await resolveAssignmentActor(); const { assignmentId } = await params; const data = await service().list(decodeURIComponent(assignmentId)); return NextResponse.json({ success: true, data }, { headers: { "Cache-Control": "private, no-store" } }); } catch (error) { return assignmentApiError(error); }
}
export async function POST(request: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
  try {
    const user = await resolveAssignmentActor();
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > 12 * 1024 * 1024) return NextResponse.json({ success: false, code: "photo-file-too-large", error: "Image exceeds the 10 MB limit." }, { status: 413 });
    const form = await request.formData();
    const { assignmentId } = await params;
    const data = await service().upload(decodeURIComponent(assignmentId), { photoId: String(form.get("photoId") ?? ""), category: String(form.get("category") ?? ""), caption: String(form.get("caption") ?? ""), file: form.get("file") as File, thumbnail: form.get("thumbnail") as File | null }, actor(user));
    return NextResponse.json({ success: true, data }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return assignmentApiError(error); }
}