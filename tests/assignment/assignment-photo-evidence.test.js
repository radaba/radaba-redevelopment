import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ASSIGNMENT_PHOTO_CATEGORIES, ASSIGNMENT_PHOTO_LIMITS, assignmentPhotoSignatureMatches, assignmentPhotoStoragePaths, isAssignmentPhotoCategory } from "../../src/features/assignment/assignment-photo-contract.mjs";
const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8");

test("centralizes the three evidence categories and conservative limits", () => {
  assert.deepEqual([...ASSIGNMENT_PHOTO_CATEGORIES], ["before", "during", "after"]);
  assert.equal(ASSIGNMENT_PHOTO_LIMITS.maximumBytes, 10 * 1024 * 1024);
  assert.equal(ASSIGNMENT_PHOTO_LIMITS.maximumBatchFiles, 10);
  assert.equal(ASSIGNMENT_PHOTO_LIMITS.maximumPerCategory, 30);
  assert.equal(isAssignmentPhotoCategory("testing"), false);
});
test("validates JPEG PNG and WebP signatures rather than extensions", () => {
  assert.equal(assignmentPhotoSignatureMatches(Uint8Array.from([0xff,0xd8,0xff]), "image/jpeg"), true);
  assert.equal(assignmentPhotoSignatureMatches(Uint8Array.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]), "image/png"), true);
  assert.equal(assignmentPhotoSignatureMatches(Uint8Array.from([82,73,70,70,0,0,0,0,87,69,66,80]), "image/webp"), true);
  assert.equal(assignmentPhotoSignatureMatches(Uint8Array.from([60,115,118,103]), "image/svg+xml"), false);
  assert.equal(assignmentPhotoSignatureMatches(Uint8Array.from([0xff,0xd8,0xff]), "application/octet-stream"), false);
});
test("storage paths are Assignment scoped collision safe and ignore original filename", () => {
  assert.deepEqual(assignmentPhotoStoragePaths("push-key", "before", "uuid", "image/jpeg"), { original: "assignments/push-key/evidence/before/uuid/original.jpg", thumbnail: "assignments/push-key/evidence/before/uuid/thumbnail.jpg" });
  assert.equal(assignmentPhotoStoragePaths("push-key", "bad", "uuid", "image/jpeg"), null);
});
test("server service derives identity time and paths and enforces active-only writes", async () => {
  const source = await read("src/server/assignment/assignment-photo-service.ts");
  assert.match(source, /isCompletedAssignment\(found\.value\)/);
  assert.match(source, /uploaded_by_uid: actor\.uid/);
  assert.match(source, /uploaded_by_name: actor\.name/);
  assert.match(source, /jakartaParts\(this\.now\(\)\)\.datetime/);
  assert.match(source, /assignmentPhotoSignatureMatches/);
  assert.match(source, /cleanName\(file\.name\)/);
  assert.doesNotMatch(source, /storage_path:\s*input|uploaded_by_uid:\s*input|uploaded_at:\s*input/);
});
test("upload finalizes metadata only after objects and cleans up failed finalization", async () => {
  const source = await read("src/server/assignment/assignment-photo-service.ts");
  const save = source.indexOf("saveObject(paths.original");
  const metadata = source.indexOf("createWithinLimit", save);
  assert.ok(save > -1 && metadata > save);
  assert.match(source, /Promise\.allSettled\(saved\.map/);
  assert.match(source, /maximumPerCategory/);
  assert.match(source, /existing\.metadata\.uploaded_by_uid !== actor\.uid/);
});
test("delete is Assignment scoped and uses the approved permission matrix", async () => {
  const source = await read("src/server/assignment/assignment-photo-service.ts");
  assert.match(source, /photo\.metadata\.assignment_id !== assignmentId/);
  assert.match(source, /uploaded_by_uid === actor\.uid/);
  assert.match(source, /coordinator.*actor\.email/);
  assert.match(source, /super_admin/);
  assert.ok(source.indexOf("deleteObject(photo.metadata.storage_path)") < source.indexOf("photos.remove(found.key, photoId)"));
});
test("API authenticates before list upload content and delete operations", async () => {
  for (const route of ["src/app/api/assignments/[assignmentId]/photos/route.ts", "src/app/api/assignments/[assignmentId]/photos/[photoId]/route.ts", "src/app/api/assignments/[assignmentId]/photos/[photoId]/content/route.ts"]) {
    const source = await read(route); assert.match(source, /resolveAssignmentActor/); assert.ok(source.indexOf("resolveAssignmentActor") < source.indexOf("new AssignmentPhotoService"));
  }
  const upload = await read("src/app/api/assignments/[assignmentId]/photos/route.ts");
  assert.match(upload, /content-length/); assert.match(upload, /request\.formData\(\)/);
});
test("direct Storage access is denied and Admin owns all object operations", async () => {
  const rules = await read("storage.rules"); const repository = await read("src/server/assignment/firebase-assignment-photo-repository.ts");
  assert.match(rules, /allow read, write: if false/);
  assert.match(repository, /firebaseAdminStorage/);
  assert.doesNotMatch(repository, /getDownloadURL|makePublic/);
});
test("detail UI provides accessible states progress responsive grid and keyboard viewer", async () => {
  const source = await read("src/components/assignment/assignment-photo-evidence.tsx");
  for (const value of ["Photo Evidence", "Upload progress", "Loading photo evidence", "Previous photo", "Next photo", "Close photo viewer", "Completed · read-only"]) assert.ok(source.includes(value));
  assert.match(source, /accept="image\/\*"/); assert.match(source, /onDrop=/); assert.match(source, /xhr\.upload\.onprogress/); assert.match(source, /crypto\.randomUUID/); assert.match(source, /ArrowLeft/); assert.match(source, /ArrowRight/); assert.match(source, /role="dialog"/); assert.match(source, /grid-cols-2.*sm:grid-cols-3.*lg:grid-cols-4/);
});
test("legacy image_total workflow timeline and completion prerequisites remain untouched", async () => {
  const detail = await read("src/components/assignment/assignment-detail.tsx"); const timeline = await read("src/features/assignment/assignment-timeline.mjs"); const workflow = await read("src/features/assignment/assignment-workflow.mjs");
  assert.match(detail, /AssignmentPhotoEvidence/); assert.match(timeline, /assignment_photo|photo|evidence/i); assert.doesNotMatch(workflow, /photo|evidence|image_total/i);
});