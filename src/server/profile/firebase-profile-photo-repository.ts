import "server-only";
import type { Database } from "firebase-admin/database";
import type { Storage } from "firebase-admin/storage";
import { firebaseAdminDatabase, firebaseAdminStorage } from "@/lib/firebase/admin";
import type { ProfilePhotoRepository } from "./profile-photo-repository";

export class FirebaseProfilePhotoRepository implements ProfilePhotoRepository {
  constructor(
    private readonly database: Database = firebaseAdminDatabase,
    private readonly storage: Storage = firebaseAdminStorage,
  ) {}
  async saveObject(path: string, bytes: Buffer, contentType: string) {
    await this.storage
      .bucket()
      .file(path)
      .save(bytes, {
        resumable: false,
        contentType,
        metadata: { cacheControl: "private, no-store", contentDisposition: "inline" },
      });
  }
  async readObject(path: string) {
    const file = this.storage.bucket().file(path);
    const [exists] = await file.exists();
    if (!exists) return null;
    const [[bytes], [metadata]] = await Promise.all([file.download(), file.getMetadata()]);
    return { bytes, contentType: String(metadata.contentType ?? "application/octet-stream") };
  }
  async deleteObject(path: string) {
    await this.storage.bucket().file(path).delete({ ignoreNotFound: true });
  }
  async updateUserPhoto(
    userKey: string,
    value: {
      photo_url: string;
      photo_name: string;
      photo_storage_path: string;
      photo_updated_at: string;
      updated_at: string;
    },
  ) {
    await this.database.ref("user").child(userKey).update(value);
  }
  async clearUserPhoto(userKey: string, updatedAt: string) {
    await this.database.ref("user").child(userKey).update({
      photo_url: null,
      photo_name: null,
      photo_storage_path: null,
      photo_updated_at: null,
      updated_at: updatedAt,
    });
  }
}
