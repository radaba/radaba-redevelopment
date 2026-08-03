# Image model

There are three distinct image models:

1. Android binary objects in Firebase Storage (legacy `visit/...` naming).
2. Mobile aggregate metadata in `image/{pushKey}`, selected by `assignment_id`.
3. Dynamic `foto_*_name` and `foto_*_url` pairs embedded primarily in `cell` and `tower` records and parsed by `embedded-image-contract`.
4. Web operational photos in `assignment_photo/{assignmentKey}/{photoId}` with Storage metadata.

Mobile `updateImageDetails` reads the Assignment, upserts the sector Cell by `rcell_id`, and upserts the `image` aggregate by `assignment_id` (`firebase-mobile-image-command-repository.ts:8-10`). Existing duplicates are all updated. Storage upload and RTDB metadata write are separate operations, so orphan objects and metadata-without-object are possible.

R20G-C confirms `/image` is also the Assignment-linked Full Tower technical form. Exact `assignment_id` create/update synchronizes `tower_type`, `tower_height`, `total_antenna`, `total_rru`, `single_sector`, `multi_sector`, and `route_distance` into an eligible active Assignment snapshot. Source scalar types are preserved; blank/missing values are omitted. Existing exact duplicate Image rows continue to be updated for Android compatibility. Administrative backfill distinguishes `image_missing`, `image_single_match`, `image_duplicate_identical`, and `image_duplicate_conflicting`; conflicts are never chosen. `justifikasi` remains unresolved and excluded.

Web assignment photos store `assignment_id`, category, storage paths, generated/original filename, MIME type, size, actor/time, and caption (`assignment-photo-contract.ts:2-11`). Delete removes Storage objects before RTDB metadata, creating a different partial-failure window.
