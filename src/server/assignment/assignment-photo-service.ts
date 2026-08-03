import { Buffer } from "node:buffer";
import type { RawAssignmentRecord } from "@/features/assignment/assignment-types";
import { isCompletedAssignment, jakartaParts } from "@/features/assignment/assignment-command-contract";
import { ASSIGNMENT_PHOTO_LIMITS, ASSIGNMENT_PHOTO_MIME_EXTENSIONS, assignmentPhotoSignatureMatches, assignmentPhotoStoragePaths, isAssignmentPhotoCategory, type AssignmentPhoto, type AssignmentPhotoCategory, type AssignmentPhotoMetadata } from "@/features/assignment/assignment-photo-contract";
import type { AssignmentCommandRepository } from "./assignment-command-repository";
import { AssignmentCommandError } from "./assignment-command-errors";
import type { AssignmentPhotoRepository, StoredAssignmentPhoto } from "./assignment-photo-repository";

export interface AssignmentPhotoActor { uid: string; name: string; email: string; role: string; }
export interface AssignmentPhotoUpload { photoId: string; category: string; file: File; thumbnail?: File | null; caption?: string; }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const cleanName = (value: string) => value.replace(/[\u0000-\u001f\u007f]/g, "").replace(/[\\/]/g, "_").trim().slice(0, 180) || "photo";

export class AssignmentPhotoService {
  constructor(private readonly assignments: AssignmentCommandRepository, private readonly photos: AssignmentPhotoRepository, private readonly now = () => new Date()) {}
  private async assignment(id: string) {
    const assignmentId = id.trim();
    const found = await this.assignments.findByAssignmentId(assignmentId);
    if (found.length !== 1) throw new AssignmentCommandError(found.length ? "stale-record" : "assignment-not-found", found.length ? "Assignment identity is ambiguous." : "Assignment was not found.");
    return found[0];
  }
  private view(assignmentId: string, stored: StoredAssignmentPhoto): AssignmentPhoto {
    const base = `/api/assignments/${encodeURIComponent(assignmentId)}/photos/${encodeURIComponent(stored.id)}/content`;
    return { id: stored.id, assignmentId, category: stored.metadata.category, originalFilename: stored.metadata.original_filename, mimeType: stored.metadata.mime_type, sizeBytes: Number(stored.metadata.size_bytes), uploadedAt: stored.metadata.uploaded_at, uploadedByUid: stored.metadata.uploaded_by_uid, uploadedByName: stored.metadata.uploaded_by_name, caption: stored.metadata.caption || null, hasThumbnail: Boolean(stored.metadata.thumbnail_storage_path), viewUrl: base, thumbnailUrl: `${base}?variant=thumbnail` };
  }
  async list(assignmentId: string) {
    const found = await this.assignment(assignmentId);
    return (await this.photos.list(found.key)).map((photo) => this.view(assignmentId, photo)).sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt) || a.id.localeCompare(b.id));
  }
  async upload(assignmentId: string, input: AssignmentPhotoUpload, actor: AssignmentPhotoActor) {
    const found = await this.assignment(assignmentId);
    if (isCompletedAssignment(found.value)) throw new AssignmentCommandError("ASSIGNMENT_COMPLETED", "Completed Assignment evidence is read-only. Revisit the Assignment before uploading photos.");
    if (!uuid.test(input.photoId)) throw new AssignmentCommandError("invalid-input", "A valid upload identifier is required.");
    if (!isAssignmentPhotoCategory(input.category)) throw new AssignmentCommandError("invalid-input", "Invalid evidence category.");
    const existing = await this.photos.find(found.key, input.photoId);
    if (existing) {
      if (existing.metadata.uploaded_by_uid !== actor.uid) throw new AssignmentCommandError("assignment-conflict", "The upload identifier is already in use.");
      return this.view(assignmentId, existing);
    }
    const file = input.file;
    if (!(file instanceof File) || file.size < 1) throw new AssignmentCommandError("invalid-input", "An image file is required.");
    if (!ASSIGNMENT_PHOTO_MIME_EXTENSIONS[file.type] || file.size > ASSIGNMENT_PHOTO_LIMITS.maximumBytes) throw new AssignmentCommandError(file.size > ASSIGNMENT_PHOTO_LIMITS.maximumBytes ? "photo-file-too-large" : "invalid-input", file.size > ASSIGNMENT_PHOTO_LIMITS.maximumBytes ? "Image exceeds the 10 MB limit." : "Only JPEG, PNG, and WebP images are supported.");
    const bytes = Buffer.from(await file.arrayBuffer());
    if (!assignmentPhotoSignatureMatches(bytes, file.type)) throw new AssignmentCommandError("invalid-input", "The file content does not match a supported image format.");
    const category = input.category as AssignmentPhotoCategory;
    const paths = assignmentPhotoStoragePaths(found.key, category, input.photoId, file.type)!;
    let thumbnailBytes: Buffer | null = null;
    if (input.thumbnail instanceof File && input.thumbnail.size > 0 && input.thumbnail.size <= 2 * 1024 * 1024 && input.thumbnail.type === file.type) {
      const candidate = Buffer.from(await input.thumbnail.arrayBuffer());
      if (assignmentPhotoSignatureMatches(candidate, input.thumbnail.type)) thumbnailBytes = candidate;
    }
    const caption = input.caption?.trim() ?? "";
    if (caption.length > ASSIGNMENT_PHOTO_LIMITS.maximumCaptionLength) throw new AssignmentCommandError("invalid-input", "Caption must be 500 characters or fewer.");
    const metadata: AssignmentPhotoMetadata = { assignment_id: assignmentId, category, storage_path: paths.original, ...(thumbnailBytes ? { thumbnail_storage_path: paths.thumbnail } : {}), filename: `original.${ASSIGNMENT_PHOTO_MIME_EXTENSIONS[file.type]}`, original_filename: cleanName(file.name), mime_type: file.type, size_bytes: file.size, uploaded_at: jakartaParts(this.now()).datetime, uploaded_by_uid: actor.uid, uploaded_by_name: actor.name, ...(caption ? { caption } : {}) };
    const saved: string[] = [];
    try {
      await this.photos.saveObject(paths.original, bytes, file.type); saved.push(paths.original);
      if (thumbnailBytes) { await this.photos.saveObject(paths.thumbnail, thumbnailBytes, file.type); saved.push(paths.thumbnail); }
      const outcome = await this.photos.createWithinLimit(found.key, input.photoId, metadata, category, ASSIGNMENT_PHOTO_LIMITS.maximumPerCategory);
      if (outcome === "limit") throw new AssignmentCommandError("photo-limit-reached", "This evidence category already contains 30 photos.");
      if (outcome === "exists") return this.view(assignmentId, (await this.photos.find(found.key, input.photoId))!);
      return this.view(assignmentId, { id: input.photoId, metadata });
    } catch (error) {
      await Promise.allSettled(saved.map((path) => this.photos.deleteObject(path)));
      throw error;
    }
  }
  async remove(assignmentId: string, photoId: string, actor: AssignmentPhotoActor) {
    const found = await this.assignment(assignmentId);
    if (isCompletedAssignment(found.value)) throw new AssignmentCommandError("ASSIGNMENT_COMPLETED", "Completed Assignment evidence is read-only.");
    const photo = await this.photos.find(found.key, photoId);
    if (!photo || photo.metadata.assignment_id !== assignmentId) throw new AssignmentCommandError("photo-not-found", "Photo was not found.");
    const coordinator = String((found.value as RawAssignmentRecord).coordinator_email ?? "").trim().toLowerCase();
    const allowed = photo.metadata.uploaded_by_uid === actor.uid || (coordinator && coordinator === actor.email.trim().toLowerCase()) || actor.role.trim().toLowerCase() === "super_admin";
    if (!allowed) throw new AssignmentCommandError("permission-denied", "You do not have permission to delete this photo.");
    await this.photos.deleteObject(photo.metadata.storage_path);
    if (photo.metadata.thumbnail_storage_path) await this.photos.deleteObject(photo.metadata.thumbnail_storage_path);
    await this.photos.remove(found.key, photoId);
  }
  async content(assignmentId: string, photoId: string, thumbnail: boolean) {
    const found = await this.assignment(assignmentId);
    const photo = await this.photos.find(found.key, photoId);
    if (!photo || photo.metadata.assignment_id !== assignmentId) throw new AssignmentCommandError("photo-not-found", "Photo was not found.");
    const path = thumbnail && photo.metadata.thumbnail_storage_path ? photo.metadata.thumbnail_storage_path : photo.metadata.storage_path;
    return { bytes: await this.photos.readObject(path), mimeType: photo.metadata.mime_type, filename: photo.metadata.original_filename };
  }
}