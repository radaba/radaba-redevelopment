export interface StoredProfilePhoto {
  bytes: Buffer;
  contentType: string;
}
export interface ProfilePhotoRepository {
  saveObject(path: string, bytes: Buffer, contentType: string): Promise<void>;
  readObject(path: string): Promise<StoredProfilePhoto | null>;
  deleteObject(path: string): Promise<void>;
  updateUserPhoto(
    userKey: string,
    value: {
      photo_url: string;
      photo_name: string;
      photo_storage_path: string;
      photo_updated_at: string;
      updated_at: string;
    },
  ): Promise<void>;
  clearUserPhoto(userKey: string, updatedAt: string): Promise<void>;
}
