# Radaba Business Rules

## Administrator roles

User role assignment accepts only the centralized exact assignable identifiers documented in `.docs/role-privilege-contract.md`. Existing legacy or unknown values are display-only. Privilege-only fields cannot be assigned to users. Only strict boolean `true` grants privilege access.

## Completed Assignment Rigger lock

The assigned Rigger becomes immutable when an Assignment is completed. Completion uses the shared legacy-compatible Assignment predicate: `assignment_status=Completed`, `assignment_state=Completed` or `Finished`, `completed=true`, or a stored `completed_datetime`, unless the persisted record is explicitly active.

The lock applies only when the trusted requested Rigger differs from the latest persisted Rigger. Rigger email is the primary case-insensitive identity; legacy records without email fall back to the normalized Rigger name.

- Active Assignment plus a different eligible Rigger: allowed.
- Completed Assignment plus a different Rigger: rejected with HTTP 409 `ASSIGNMENT_COMPLETED`.
- Completed Assignment plus a cleared Rigger: rejected by the comparison rule; the current API also rejects an empty `riggerKey` during input validation.
- Completed Assignment plus the same Rigger: treated as unchanged and does not rewrite the database.
- Non-Rigger operations are unaffected by this rule.

The browser lock is explanatory only. The command service checks the loaded record and a Firebase transaction repeats the identity and completion checks against the latest persisted Assignment before writing. A stale client cannot race a completion update.

No bulk reassignment operation or general Assignment edit endpoint currently exists. Bulk import creates new Assignments only.

## Revisit relationship

Revisit Assignment is implemented as a separate completed-only workflow. It atomically returns the existing record to `On Progress` / `Open` while preserving completion history. Once the persisted Assignment is active again, normal Rigger reassignment follows the existing permission and eligibility rules. There is no force, ignore-completion, or administrator bypass flag.

## Authorization and auditing

Assignment commands require an active authenticated user with strict access to `/assignment`. The completed lock applies to every authorized role. No Assignment audit node is written because no general Assignment audit contract is confirmed.

## Assignment operational workflow

The canonical persisted Assignment states remain `Open`, `Accepted`, `On Progress`, `Paused`, `Finished`, `Rejected`, and `Dropped`. The current web workflow implements only the confirmed linear actions:

- `Open` â†’ Accept Assignment â†’ `Accepted`
- `Accepted` â†’ Start Work â†’ `On Progress`
- `On Progress` â†’ Pause Work â†’ `Paused`
- `Paused` â†’ Resume Work â†’ `On Progress`
- `On Progress` â†’ Complete Assignment â†’ `Finished` with `assignment_status=Completed` and `completed=true`

Each action writes the existing matching date/datetime fields and rebuilds the legacy created-date state/status composites. The server accepts only the action name; it does not accept status values or timestamps from the browser. The Firebase transaction checks the latest persisted state before writing, so stale or repeated actions fail with HTTP 409 `ASSIGNMENT_INVALID_TRANSITION`.

Rejection, dropping, closing, travelling, arrival, waiting, and testing are not web workflow actions yet because their repeated-event, composite, permission, or persisted-field contracts remain unconfirmed. Revisit Assignment remains the only approved path from a completed representation back to `On Progress`.

### Resume and completion details

Resume is an action, not a stored state. It returns a paused Assignment to `On Progress` while preserving the original check-in and pause timestamps. The legacy schema has no reliable resume timestamp, so no Work Resumed timeline event is fabricated.

Completion is permitted only from `On Progress`. It writes the canonical state `Finished`, status `Completed`, `completed=true`, Jakarta completion date/datetime, and the authenticated actor in optional `completed_by_uid` and `completed_by_name` fields. No photo, note, checklist, FTP, report, or ownership prerequisite currently exists. Completion naturally activates the Rigger lock and remains compatible with Revisit.

## Assignment photo evidence

Assignment evidence uses three canonical categories: `before`, `during`, and `after`. Metadata is stored at `assignment_photo/{assignmentPushKey}/{photoId}` and binary objects remain in Firebase Storage. The legacy `assignment.image_total` field is not changed.

Active Assignments with strict `/assignment` access accept valid evidence. Completed evidence is read-only until Revisit returns the same Assignment to an active state. Revisit preserves earlier photos. Evidence is not required for completion and does not create lifecycle events.

Original uploads are limited to JPEG, PNG, and WebP, 10 MB each, 10 selected files per batch, and 30 photos per category. Delete is limited to the uploader, matching coordinator, or `super_admin`, and is forbidden while completed.

## Assignment checklist and Work Report

Work execution is optional and does not gate completion. The checklist uses only `pending`, `completed`, and `not_applicable`; eight server-owned default items cannot be renamed or deleted, while authorized users may manage bounded custom items. The Work Report records findings, actions performed, technical result, completion notes, recommendations, and informational materials.

Viewing follows strict `/assignment` access. Editing requires an active Assignment plus assigned Rigger email, matching Coordinator email, or `super_admin`. Completed records are read-only with no override. Revisit preserves existing execution data and restores editing for an eligible actor. Actor/time and section revision are server-controlled inside the Assignment transaction.

## Assignment comments and collaboration

Each Assignment has one plain-text Discussion thread stored outside the lifecycle record. Active users with strict `/assignment` access may comment. Users may edit or soft-delete their own comment for 15 minutes; `super_admin` may delete any non-deleted comment. Identity, role, and timestamps are server-controlled.

Completed Assignments keep Discussion visible but read-only. Revisit restores commenting. Comments remain history and never create workflow timeline events or notifications.
## Assignment dashboard and analytics

Assignment Dashboard is read-only and uses the existing strict `/assignment` visibility boundary. Analytics are scoped to a bounded created-date cohort and never update Assignment records, workflow, comments, photos, or aggregate nodes.

Completion and active status use the shared compatibility rules. Coordinator and Rigger analytics are attributed to the currently stored assignee. Missing or invalid timestamps are excluded from duration averages. Average Pause Duration remains unavailable because Resume timestamps are not stored.
## Assignment SLA, aging, and escalation readiness

SLA is calculated at read time from existing Assignment status and timestamps. Targets are centralized: Open 24 hours, Accepted 12 hours, On Progress 72 hours, and Paused 24 hours; warning begins at 75%. Escalation readiness means overdue by at least 24 hours, paused for at least 24 hours, or at least two revisits. It is an indicator only and never sends a notification.

Missing state-entry timestamps produce Unavailable, terminal states produce Not Applicable, and missing Resume history must not be inferred. No SLA result is persisted or used to change workflow behavior.
