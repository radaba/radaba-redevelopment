import * as runtime from "./profile-photo-contract.mjs";
export const PROFILE_PHOTO_MAX_BYTES = runtime.PROFILE_PHOTO_MAX_BYTES as number;
export const PROFILE_PHOTO_TYPES = runtime.PROFILE_PHOTO_TYPES as Readonly<
  Record<string, readonly string[]>
>;
export type ProfilePhotoValidation =
  { valid: true; type: string; name: string } | { valid: false; code: string; message: string };
export const cleanProfilePhotoName = runtime.cleanProfilePhotoName as (name: unknown) => string;
export const validateProfilePhotoFile = runtime.validateProfilePhotoFile as (
  file: unknown,
) => ProfilePhotoValidation;
export const validProfilePhotoSignature = runtime.validProfilePhotoSignature as (
  bytes: Uint8Array,
  type: string,
) => boolean;
