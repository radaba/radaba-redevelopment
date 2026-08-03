# Phase 7D — Assignment create and rigger reassignment

Phase 7D adds only create and rigger-reassignment server commands. Both re-verify the session, re-read the user, require Active status, and require strict `/assignment` privilege access.

Creation resolves trusted tower/user/category records, generates `NPMXL_<UPPERCASE_TOWER_ID>_<MMDDYY>_<UNIX_SECONDS>`, uses Asia/Jakarta timestamps, builds all composites centrally, and writes one complete push-key record. A final tower check rejects non-terminal conflicts with HTTP 409 and does not mutate the existing Assignment. Terminal states are Finished, Rejected, and Dropped. Because no new lock node is allowed, simultaneous creates retain a documented residual race.

Reassignment resolves the unique Assignment and an active Rigger user, then atomically updates only rigger name/email and confirmed dependent composites. Company and unrelated fields remain unchanged.

Lookups are authenticated, privilege-protected, bounded, and sanitized. This phase adds no generic writes, migration, workflow transitions, uploads, notifications, or audit node.

## Component tree and browser behavior

`AssignmentPageClient` renders `AssignmentCreateDialog` in the toolbar. Each valid desktop row and mobile card renders `AssignmentReassignRiggerDialog`. Both use `AssignmentDialogShell`; searchable references use `AssignmentReferenceLookup`.

Create submits only trusted reference identifiers, category, optional plan date, and optional trimmed description. Lookups debounce for 350 ms, require two characters for tower/users, use protected endpoints, announce loading/errors, and keep only sanitized options in component memory. Success resets, navigates to page 1, and refreshes. HTTP 409 preserves values and explains that the existing Assignment was not modified.

Reassignment displays Assignment ID, current rigger, and current partner, and submits only the new rigger key. Success preserves navigation and refreshes. Company is previewed but deliberately unchanged.

Dialogs are single-column on mobile and two-column where useful on larger screens. They include modal semantics, Escape handling, focus trapping/restoration, visible focus, pending controls, and live announcements.

## Client/server split and manual verification

The browser performs usability validation only. Server session, authorization, validation, reference resolution, conflict enforcement, timestamps, identity, defaults, and composite construction remain authoritative.

Browser checks must cover authorized/denied roles, keyboard and mobile flows, expiry, lookup errors, conflict, duplicate clicks, refresh, and sanitized errors. RTDB verification requires explicit approval for a test/non-production target. Confirm one push-key record on create, no conflict write, only documented rigger fields on reassignment, and no changes to user, tower, category, or privilege. Production writes remain unauthorized.

## Completed Assignment rigger lock

Rigger reassignment is immutable after completion. A centralized compatibility predicate recognizes `assignment_status=Completed`, `assignment_state=Completed`, the legacy terminal state `assignment_state=Finished`, boolean/string `completed=true`, or a stored `completed_datetime`. The shared UI renders a locked read-only explanation instead of opening the dialog.

The command service resolves the trusted replacement and rejects completed records only when that Rigger differs from the persisted Rigger. The Firebase command repository then uses an RTDB transaction on the existing Assignment node and repeats the identity comparison and completion check against the latest value immediately before applying the six confirmed rigger-dependent fields. An identical Rigger is a no-op and writes nothing. Completion aborts the transaction with no database update and produces HTTP 409 with code `ASSIGNMENT_COMPLETED`. No audit record is written because no confirmed Assignment audit contract exists.
