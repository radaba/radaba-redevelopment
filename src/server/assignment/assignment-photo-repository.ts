import type { AssignmentPhotoCategory, AssignmentPhotoMetadata } from "@/features/assignment/assignment-photo-contract";
export interface StoredAssignmentPhoto { id: string; metadata: AssignmentPhotoMetadata; }
export interface AssignmentPhotoRepository {
  list(assignmentKey: string): Promise<StoredAssignmentPhoto[]>;
  find(assignmentKey: string, photoId: string): Promise<StoredAssignmentPhoto | null>;
  createWithinLimit(assignmentKey: string, photoId: string, metadata: AssignmentPhotoMetadata, category: AssignmentPhotoCategory, limit: number): Promise<"created" | "exists" | "limit">;
  remove(assignmentKey: string, photoId: string): Promise<void>;
  saveObject(path: string, bytes: Buffer, mimeType: string): Promise<void>;
  deleteObject(path: string): Promise<void>;
  readObject(path: string): Promise<Buffer>;
}