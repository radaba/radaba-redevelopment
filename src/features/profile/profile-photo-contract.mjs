export const PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PROFILE_PHOTO_TYPES = Object.freeze({
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
});

const extension = (name) =>
  String(name ?? "")
    .trim()
    .toLowerCase()
    .split(".")
    .pop() ?? "";
export const cleanProfilePhotoName = (name) =>
  String(name ?? "profile-photo")
    .replace(/[\\/\u0000-\u001f\u007f]/g, "_")
    .trim()
    .slice(0, 180) || "profile-photo";

export function validateProfilePhotoFile(file) {
  if (!file || typeof file !== "object" || typeof file.arrayBuffer !== "function")
    return { valid: false, code: "photo-required", message: "Select an image to upload." };
  const type = String(file.type ?? "").toLowerCase(),
    allowed = PROFILE_PHOTO_TYPES[type];
  if (!allowed || !allowed.includes(extension(file.name)))
    return {
      valid: false,
      code: "photo-invalid-format",
      message: "Choose a JPG, JPEG, PNG, or WebP image.",
    };
  if (!Number.isFinite(file.size) || file.size <= 0)
    return { valid: false, code: "photo-empty", message: "The selected image is empty." };
  if (file.size > PROFILE_PHOTO_MAX_BYTES)
    return {
      valid: false,
      code: "photo-file-too-large",
      message: "Profile photos must be 5 MB or smaller.",
    };
  return { valid: true, type, name: cleanProfilePhotoName(file.name) };
}

export function validProfilePhotoSignature(bytes, type) {
  if (!(bytes instanceof Uint8Array)) return false;
  if (type === "image/jpeg")
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png")
    return (
      bytes.length >= 8 &&
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
        (value, index) => bytes[index] === value,
      )
    );
  if (type === "image/webp")
    return (
      bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    );
  return false;
}
