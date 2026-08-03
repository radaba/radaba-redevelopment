import * as runtime from "./assignment-photo-contract.mjs";
export type AssignmentPhotoCategory = "before" | "during" | "after";
export interface AssignmentPhoto { id: string; assignmentId: string; category: AssignmentPhotoCategory; originalFilename: string; mimeType: string; sizeBytes: number; uploadedAt: string; uploadedByUid: string; uploadedByName: string; caption: string | null; hasThumbnail: boolean; viewUrl: string; thumbnailUrl: string; }
export interface AssignmentPhotoMetadata { assignment_id: string; category: AssignmentPhotoCategory; storage_path: string; thumbnail_storage_path?: string; filename: string; original_filename: string; mime_type: string; size_bytes: number; uploaded_at: string; uploaded_by_uid: string; uploaded_by_name: string; caption?: string; }
export const ASSIGNMENT_PHOTO_CATEGORIES = runtime.ASSIGNMENT_PHOTO_CATEGORIES as readonly AssignmentPhotoCategory[];
export const ASSIGNMENT_PHOTO_CATEGORY_LABELS = runtime.ASSIGNMENT_PHOTO_CATEGORY_LABELS as Record<AssignmentPhotoCategory, string>;
export const ASSIGNMENT_PHOTO_LIMITS = runtime.ASSIGNMENT_PHOTO_LIMITS as { maximumBytes: number; maximumBatchFiles: number; maximumPerCategory: number; maximumCaptionLength: number };
export const ASSIGNMENT_PHOTO_MIME_EXTENSIONS = runtime.ASSIGNMENT_PHOTO_MIME_EXTENSIONS as Record<string, string>;
export const isAssignmentPhotoCategory = runtime.isAssignmentPhotoCategory as (value: unknown) => value is AssignmentPhotoCategory;
export const assignmentPhotoSignatureMatches = runtime.assignmentPhotoSignatureMatches as (bytes: Uint8Array, mimeType: string) => boolean;
export const assignmentPhotoStoragePaths = runtime.assignmentPhotoStoragePaths as (assignmentKey: string, category: AssignmentPhotoCategory, photoId: string, mimeType: string) => { original: string; thumbnail: string } | null;