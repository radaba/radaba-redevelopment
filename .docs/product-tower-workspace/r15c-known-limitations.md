# R15C known limitations

- The workspace uses the newest bounded Assignment plus direct Cell `tower_id` matches.
- Older Cells lacking `tower_id` and belonging only to older Assignments may not appear.
- Existing web Tower authorization is page privilege based, not per-rigger ownership based.
- Recorded timestamps are not a complete immutable audit trail.
- Tokenized Storage URLs are used internally by authorized image elements but never displayed,
  exported, logged, placed in IDs, or stored in public/shared caches.
- Image Previous/Next remains unavailable without a stable authorized global image index.
