export const ASSIGNMENT_PHOTO_CATEGORIES = Object.freeze(["before", "during", "after"]);
export const ASSIGNMENT_PHOTO_CATEGORY_LABELS = Object.freeze({ before: "Before Work", during: "During Work", after: "After Work" });
export const ASSIGNMENT_PHOTO_LIMITS = Object.freeze({ maximumBytes: 10 * 1024 * 1024, maximumBatchFiles: 10, maximumPerCategory: 30, maximumCaptionLength: 500 });
export const ASSIGNMENT_PHOTO_MIME_EXTENSIONS = Object.freeze({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" });
export function isAssignmentPhotoCategory(value) { return ASSIGNMENT_PHOTO_CATEGORIES.includes(value); }
export function assignmentPhotoSignatureMatches(bytes, mimeType) {
  if (!(bytes instanceof Uint8Array)) return false;
  if (mimeType === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === "image/png") return bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  if (mimeType === "image/webp") return bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return false;
}
export function assignmentPhotoStoragePaths(assignmentKey, category, photoId, mimeType) {
  const extension = ASSIGNMENT_PHOTO_MIME_EXTENSIONS[mimeType];
  if (!assignmentKey || !isAssignmentPhotoCategory(category) || !photoId || !extension) return null;
  const base = `assignments/${assignmentKey}/evidence/${category}/${photoId}`;
  return { original: `${base}/original.${extension}`, thumbnail: `${base}/thumbnail.${extension}` };
}