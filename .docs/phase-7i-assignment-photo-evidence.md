# Phase 7I: Assignment Photo Evidence Management

## Scope

Phase 7I adds structured `before`, `during`, and `after` field evidence to Assignment Detail. UI labels are Before Work, During Work, and After Work. Existing Assignment workflow, timeline, completion prerequisites, and legacy `image_total` are unchanged.

## Storage and metadata

Metadata is stored separately from the legacy Assignment at `assignment_photo/{assignmentPushKey}/{photoId}`. Objects use `assignments/{assignmentPushKey}/evidence/{category}/{photoId}/original.{ext}` and an optional `thumbnail.{ext}`. The stable client UUID supports idempotent retry; original filenames never control paths.

Metadata contains the business Assignment ID, category, server-owned paths, generated filename, sanitized original filename, MIME type, byte size, Jakarta upload timestamp, authenticated uploader UID/name, and optional caption. Large image content is never stored in RTDB.

## Validation and limits

JPEG, PNG, and WebP are accepted. MIME allow-list and magic bytes are checked server-side. SVG, video, arbitrary binary files, empty files, and originals above 10 MB are rejected. The UI accepts at most 10 files at once; the RTDB finalization transaction enforces 30 photos per Assignment category.

## Authorization and lifecycle

Every operation requires an Active verified session with strict `/assignment` access. Active Assignments accept uploads. Completed/Finished Assignments are read-only and must be revisited before adding or deleting evidence. Revisit preserves all existing photos under the same Assignment key.

The uploader may delete their own photo. The matching Assignment coordinator and `super_admin` may delete any photo on an active Assignment. Server code resolves metadata by Assignment scope and never accepts a client Storage path.

## Consistency

The server uploads Storage objects before making metadata visible. If RTDB finalization fails, it attempts immediate object cleanup. Delete removes the server-owned objects before removing metadata and surfaces partial failure. Storage and RTDB cannot share a transaction, so operational monitoring should identify rare cleanup failures.

## Image behavior

The original is preserved for readable engineering evidence. A browser-generated thumbnail (maximum 480 px longest edge) is uploaded when supported; the server validates it again. No heavy image-processing dependency was added. Guaranteed server-side EXIF normalization, dimension extraction, and metadata stripping remain limitations.

## Timeline and legacy compatibility

No Photo Uploaded or Photo Deleted event is fabricated. `image_total` is neither recalculated nor written because its legacy semantics remain unresolved. Photos are not a completion prerequisite.

## Deployment

`storage.rules` denies every direct client read/write because Phase 7I uses revocation-aware server APIs and Firebase Admin. Deploy manually to the intended Firebase project after review:

```text
firebase deploy --only storage
```

Do not deploy rules automatically from development. Confirm the configured bucket, hosting request-size allowance above the 10 MB file limit, Admin Storage IAM, and production-shaped RTDB access before enabling uploads.