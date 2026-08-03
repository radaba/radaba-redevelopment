# Data lifecycle

- Tower: web/import create; admin edit; mobile operational status update; no archive/delete policy.
- Assignment: web/import create snapshot; web/mobile lifecycle mutation; terminal retention; revisit reopening; no general deletion.
- Cell/image: Android/API upsert; retained indefinitely; no archive/delete/reconciliation.
- Assignment photo/comment: web create/read/update/delete with scoped policies.
- Report: local Android generation, Storage upload, Assignment metadata update; no history or cleanup.
- User: Auth + RTDB profile; role/status/profile mutation; Auth disable/delete flows may not atomically remove profile.
- Audits: Tower audit intended append-only; administrator audit best-effort; retention/deletion policy absent.
