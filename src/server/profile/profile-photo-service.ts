import "server-only";
import {
  validProfilePhotoSignature,
  validateProfilePhotoFile,
  PROFILE_PHOTO_TYPES,
} from "@/features/profile/profile-photo-contract";
import {
  recordAdministratorAudit,
  type AdministratorAuditAppendRepository,
} from "@/features/admin/administrator-audit-contract";
import type { ProfileRepository } from "./profile-repository";
import type { ProfilePhotoRepository } from "./profile-photo-repository";
import { ProfileServiceError, type ProfileActor } from "./profile-service";
import { resolveAuthenticatedProfile } from "./authenticated-profile-resolver";
const owned = (authUid: string, path: string) =>
  path.startsWith(`profile-photo/${authUid}/`) || path === `profile-photo/${authUid}`;
type Context = { requestIdentifier: string; ipAddress: string | null; userAgent: string | null };
export class ProfilePhotoService {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly photos: ProfilePhotoRepository,
    private readonly audit: AdministratorAuditAppendRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}
  async upload(actor: ProfileActor, file: unknown, context: Context) {
    const resolved = await resolveAuthenticatedProfile(this.profiles, actor, {
        route: "profile_photo_upload",
      }),
      validation = validateProfilePhotoFile(file);
    if (!validation.valid)
      throw new ProfileServiceError(
        validation.code,
        validation.code === "photo-file-too-large" ? 413 : 400,
        validation.message,
      );
    const bytes = Buffer.from(await (file as File).arrayBuffer());
    if (!validProfilePhotoSignature(bytes, validation.type))
      throw new ProfileServiceError(
        "photo_upload_failed",
        400,
        "The selected file is not a valid image.",
      );
    const extension = PROFILE_PHOTO_TYPES[validation.type][0],
      updatedAt = this.now().toISOString(),
      newPath = `profile-photo/${resolved.authUid}/avatar-${Date.parse(updatedAt)}.${extension}`,
      previousPath =
        resolved.record.photoStoragePath ||
        (resolved.record.photoUrl ? `profile-photo/${resolved.authUid}` : "");
    try {
      await this.photos.saveObject(newPath, bytes, validation.type);
    } catch {
      throw new ProfileServiceError("photo_upload_failed", 500, "Profile photo upload failed.");
    }
    const value = {
      photo_url: "/api/profile/photo",
      photo_name: validation.name,
      photo_storage_path: newPath,
      photo_updated_at: updatedAt,
      updated_at: updatedAt,
    };
    try {
      await this.photos.updateUserPhoto(resolved.userKey, value);
    } catch {
      await this.photos.deleteObject(newPath).catch(() => {});
      throw new ProfileServiceError(
        "photo_metadata_failed",
        500,
        "Profile photo metadata could not be saved.",
      );
    }
    const action = previousPath ? "replaced" : "uploaded";
    await recordAdministratorAudit(this.audit, {
      administratorIdentifier: resolved.authUid,
      administratorEmail: actor.email,
      action: `profile_photo_${action}`,
      resourceType: "user_profile_photo",
      resourceIdentifier: resolved.userKey,
      summary: `Profile photo ${action}`,
      before:
        previousPath && owned(resolved.authUid, previousPath)
          ? { photo_storage_path: previousPath }
          : {},
      after: {
        photo_storage_path: newPath,
        photo_name: validation.name,
        source: "profile_self_service",
        identity_resolution: resolved.lookupStrategy,
      },
      ...context,
    });
    let cleanupWarning: string | undefined;
    if (previousPath && previousPath !== newPath && owned(resolved.authUid, previousPath)) {
      try {
        await this.photos.deleteObject(previousPath);
      } catch {
        cleanupWarning =
          "The new photo is active, but the previous owned object could not be cleaned up.";
      }
    }
    return {
      photoUrl: `${value.photo_url}?v=${encodeURIComponent(updatedAt)}`,
      photoName: value.photo_name,
      photoStoragePath: newPath,
      updatedAt,
      action,
      cleanupWarning,
    };
  }
  async read(actor: ProfileActor) {
    const resolved = await resolveAuthenticatedProfile(this.profiles, actor, {
        route: "profile_photo_read",
      }),
      path =
        resolved.record.photoStoragePath ||
        (resolved.record.photoUrl ? `profile-photo/${resolved.authUid}` : "");
    if (!path || !owned(resolved.authUid, path))
      throw new ProfileServiceError("profile_not_found", 404, "Profile photo not found.");
    const photo = await this.photos.readObject(path);
    if (!photo) throw new ProfileServiceError("profile_not_found", 404, "Profile photo not found.");
    return photo;
  }
  async remove(actor: ProfileActor, context: Context) {
    const resolved = await resolveAuthenticatedProfile(this.profiles, actor, {
        route: "profile_photo_remove",
      }),
      path =
        resolved.record.photoStoragePath ||
        (resolved.record.photoUrl ? `profile-photo/${resolved.authUid}` : ""),
      updatedAt = this.now().toISOString();
    try {
      await this.photos.clearUserPhoto(resolved.userKey, updatedAt);
    } catch {
      throw new ProfileServiceError(
        "photo_metadata_failed",
        500,
        "Profile photo metadata could not be removed.",
      );
    }
    await recordAdministratorAudit(this.audit, {
      administratorIdentifier: resolved.authUid,
      administratorEmail: actor.email,
      action: "profile_photo_removed",
      resourceType: "user_profile_photo",
      resourceIdentifier: resolved.userKey,
      summary: "Profile photo removed",
      before: path && owned(resolved.authUid, path) ? { photo_storage_path: path } : {},
      after: { source: "profile_self_service", identity_resolution: resolved.lookupStrategy },
      ...context,
    });
    let cleanupWarning: string | undefined;
    if (path && owned(resolved.authUid, path)) {
      try {
        await this.photos.deleteObject(path);
      } catch {
        cleanupWarning =
          "Photo metadata was removed, but the owned Storage object could not be cleaned up.";
      }
    }
    return { removed: true, updatedAt, cleanupWarning };
  }
}
