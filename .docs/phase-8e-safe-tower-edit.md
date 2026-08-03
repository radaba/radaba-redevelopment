# Phase 8E — Safe Tower Edit

## Proven compatibility decisions

- The Firebase child key and stored `tower_id` are immutable. Assignments resolve Towers by normalized `tower_id`; no safe rename/cross-reference mechanism exists.
- Writes require the existing strict administrator session: an Active `super_admin` with the strict `/privilege` contract. Tower reads retain the Active `/assignment` rules.
- Existing Tower records contain no reliable version or update metadata. Editing therefore uses documented last-write-wins behavior and does not add timestamps, versions, or actor fields.
- Approved editable fields are the proven create/read fields plus `roh_cluster`, which exists in operational Tower records. Remarks and stored map URLs remain unsupported.

## Write behavior

`PATCH /api/towers/[towerKey]` validates the immutable Firebase key, performs one bounded lookup, rejects `tower_id` and unknown fields, validates required site/region/cluster/coordinates and radio ranges, then sends one child-level Firebase `update()` containing only changed fields. A no-op request performs no write. Empty optional values become absent RTDB children; numeric zero is preserved. The endpoint returns 400 for invalid input and 404 for a missing Tower.

No Assignment, role, privilege, or other record is modified.

## User experience

Authorized administrators see **Edit Tower** on the Tower detail page. The editor reuses the create-page sections, displays Tower ID read-only, is a desktop modal/mobile full-screen surface, traps keyboard focus, supports Escape and Cancel, warns before discarding dirty changes, reports errors accessibly, restores focus, and refreshes the server-rendered detail after success. Map coordinates update on the next map render; marker dragging is not introduced.

## Verification boundary

Automated tests cover normalization, optional deletion, zero preservation, immutable IDs, unknown fields, required fields, coordinate/radio bounds, authorization wiring, 404 mapping, minimal/no-op writes, bounded Firebase paths, accessibility, refresh behavior, and absence of invented concurrency or Assignment writes. Operational editing must only be performed later with an explicitly identified disposable Tower; Phase 8E validation does not mutate production-compatible data.
