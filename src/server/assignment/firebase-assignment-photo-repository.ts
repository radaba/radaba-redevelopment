import "server-only";
import type { DataSnapshot, Database } from "firebase-admin/database";
import type { Storage } from "firebase-admin/storage";
import { firebaseAdminDatabase, firebaseAdminStorage } from "@/lib/firebase/admin";
import type { AssignmentPhotoCategory, AssignmentPhotoMetadata } from "@/features/assignment/assignment-photo-contract";
import type { AssignmentPhotoRepository, StoredAssignmentPhoto } from "./assignment-photo-repository";

export class FirebaseAssignmentPhotoRepository implements AssignmentPhotoRepository {
  constructor(private readonly db: Database = firebaseAdminDatabase, private readonly storage: Storage = firebaseAdminStorage) {}
  private ref(assignmentKey: string) { return this.db.ref("assignment_photo").child(assignmentKey); }
  async list(assignmentKey: string) {
    const snapshot = await this.ref(assignmentKey).once("value");
    const photos: StoredAssignmentPhoto[] = [];
    snapshot.forEach((child: DataSnapshot) => { photos.push({ id: child.key ?? "", metadata: child.val() as AssignmentPhotoMetadata }); });
    return photos;
  }
  async find(assignmentKey: string, photoId: string) {
    const snapshot = await this.ref(assignmentKey).child(photoId).once("value");
    return snapshot.exists() ? { id: photoId, metadata: snapshot.val() as AssignmentPhotoMetadata } : null;
  }
  async createWithinLimit(assignmentKey: string, photoId: string, metadata: AssignmentPhotoMetadata, category: AssignmentPhotoCategory, limit: number) {
    let outcome: "created" | "exists" | "limit" = "limit";
    const result = await this.ref(assignmentKey).transaction((current) => {
      const records = (current ?? {}) as Record<string, AssignmentPhotoMetadata>;
      if (records[photoId]) { outcome = "exists"; return; }
      if (Object.values(records).filter((photo) => photo?.category === category).length >= limit) { outcome = "limit"; return; }
      outcome = "created";
      return { ...records, [photoId]: metadata };
    }, undefined, false);
    return result.committed ? "created" : outcome;
  }
  async remove(assignmentKey: string, photoId: string) { await this.ref(assignmentKey).child(photoId).remove(); }
  async saveObject(path: string, bytes: Buffer, mimeType: string) {
    await this.storage.bucket().file(path).save(bytes, { resumable: false, contentType: mimeType, metadata: { cacheControl: "private, max-age=3600", contentDisposition: "inline" } });
  }
  async deleteObject(path: string) { await this.storage.bucket().file(path).delete({ ignoreNotFound: true }); }
  async readObject(path: string) { const [bytes] = await this.storage.bucket().file(path).download(); return bytes; }
}