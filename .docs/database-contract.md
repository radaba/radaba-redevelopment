---

## `.docs/database-contract.md`

````md
# Radaba Database Contract

## Database

Firebase Realtime Database.

The existing database is the source of truth.

## Protected paths

### User path

```text
user
```
````

## Assignment read contract

The exact Assignment RTDB path is `assignment`. Its children use Firebase push keys, while `assignment_id` remains a separate stored business identifier. Phase 7A preserves existing snake_case fields, scalar variations, and composite-field names. It performs no RTDB writes or stored-value normalization. See `assignment-contract.md` for mappings and unresolved production evidence.

## Administrator data contracts

`user` and `privilege` are both Firebase push-key collections. User role/status commands update only `user/{pushKey}/role` or `user/{pushKey}/status`. Privilege commands update only an existing strict boolean at `privilege/{pushKey}/{role}`. No role, audit, or permissions node is added.

## Phase 7E writes

A successful import performs one root multi-location update containing only assignment/<new-push-key> records. No import, lock, user, tower, category, or privilege node is added or changed.

## Assignment revisit fields

Revisiting updates the existing `assignment/{pushKey}` record; it never creates a duplicate Assignment or a separate global audit node. The approved optional metadata is:

- `revisit_count`: numeric count, defaulted to `0` when absent and incremented atomically.
- `last_revisit_at`, `last_revisit_by`, `last_revisit_reason`: latest event summary.
- `revisit_history/{eventPushKey}`: append-only event containing `action`, `at`, `by_uid`, `by_name`, `reason`, `previous_status`, `new_status`, and `previous_completed_at`.

The transaction sets `assignment_state` to `On Progress`, `assignment_status` to `Open`, and `completed` to `false`, and rebuilds existing dependent composite index fields. Existing completion/closed timestamps and all other Assignment data are preserved as history.

## Assignment workflow writes

Workflow transitions update the existing `assignment/{pushKey}` record transactionally. They use only `assignment_state`, the matching accepted/check-in/paused date and datetime fields, and the existing `index_created_date_assignment_state` and legacy-named `index_created_date_assignment_status` composites. No path, required field, history collection, or status string is added.

### Completion actor and Resume compatibility

Successful completion adds two approved optional scalar fields to the existing Assignment record: `completed_by_uid` and `completed_by_name`. Completion also updates existing state/status/completed, completion timestamp, created-date composite, and Rigger-email/status composite fields atomically. Resume adds no field and preserves existing check-in and pause timestamps.

## Assignment photo metadata

Phase 7I adds the optional top-level RTDB path `assignment_photo`. Its shape is `assignment_photo/{assignmentPushKey}/{photoId}`. Each record stores `assignment_id`, `category`, `storage_path`, optional `thumbnail_storage_path`, generated `filename`, sanitized `original_filename`, `mime_type`, numeric `size_bytes`, server `uploaded_at`, `uploaded_by_uid`, `uploaded_by_name`, and optional `caption`.

The path is separate from `assignment/{pushKey}` so legacy workflow transactions and Android-compatible records are not enlarged. The existing `image_total` scalar is not synchronized or modified. No Firestore structure is introduced.

## Assignment work execution fields

Phase 7J adds optional `work_checklist` and `work_report` children beneath `assignment/{pushKey}`. `work_checklist` stores revision, initialization/update actor metadata, and keyed items with label, canonical status, note, custom flag, and update actor metadata. `work_report` stores revision, five snake_case narrative fields, keyed structured materials, and update actor metadata.

Both children are bounded and optional. Legacy Assignments require no migration; missing checklist data maps to eight virtual pending defaults and missing report data maps to an empty report. Revisit and lifecycle writes preserve both children. No new top-level node, Firestore structure, inventory path, or required field is introduced.

## Tower read contract

The existing `tower` push-key collection remains unchanged. `tower_id` is the business identifier and the child key is the internal detail identity. Phase 8 performs bounded reads only and adds no fields, indexes, migrations, or writes.

## Tower create contract

Phase 8D may append one push-key child containing only operationally proven Tower scalar fields. Required new-record fields are `tower_id`, `sitename`, `region`, `new_cluster_name`, `latitude`, and `longitude`. Duplicate comparison is normalized exact `tower_id` inside the existing collection transaction. Existing records, fields, types, child locations, and Assignment relationships are not changed.

## Phase 8B relationship read

Related records use the existing equality `assignment.tower_id === tower.tower_id`. The repository applies `limitToLast(20)` with a hard maximum of 50 and writes nothing. Existing Tower ID composites, paths, fields, and indexes remain unchanged.
## Phase 8F Tower writes

Bulk import adds normal push-key children beneath the existing `tower` node using proven fields only. One collection transaction preserves normalized `tower_id` uniqueness. No node, index, field, existing Tower, or Assignment schema is changed.
## Tower audit storage

Phase 8G adds only `tower_audit/{towerKey}/{auditKey}`. Events are append-only push-key records with server actor/time and compact canonical field diffs. Tower records and Assignment records are unchanged; no backfill or migration rewrites existing data.
# Mobile compatibility paths

M4R preserves exact RTDB node names and reads `cell` by `assignment_id`; it adds no fields, indexes, writes, or schema changes.
# Phase M6R database contract

M6R reads existing `cell` and `utility` nodes only. It adds no nodes, fields,
indexes, migrations, generated keys, transactions, or writes.
# Phase M8R data writes

M8R writes only existing `cell` and `image` nodes after reading `assignment`.
It adds no schema, index, transaction, metric, or Storage path.

## Mobile Finished write paths

M9R-C preserves existing assignment, cell, image, tower, user, and achievement paths and fields. No node, field, type, or schema migration is introduced.

## M9R-D lifecycle audit

The audited write allowlist is assignment, cell, image, tower, user, and achievement. No schema, field, type, node, query-shape, migration, metric, or repair marker was added.

## M11R database impact

No node, field, type, index, or required-field change was introduced. Login audit writes intentionally stop persisting raw ID tokens. Replay/idempotency records and transactional fan-out changes are deferred because they require separate schema and compatibility approval.


## R15C database impact

R15C reads existing `tower`, `assignment`, and `cell` paths only. It adds no field, index, node, migration, required value, denormalized aggregate, image table, or write.


## R17 database impact

Report metadata remains embedded at `assignment/{pushKey}` using proven `report_name` and `report_url` fields. R17 reads existing records only and adds no report node, field, index, migration, or write.

## R20G Assignment synchronization
ssignment_audit/{assignmentPushKey}/{auditPushKey} records bounded Tower-synchronization audit events. Existing 	ower, ssignment, keys, 	ower_id, and scalar shapes are unchanged. Synchronization uses exact 	ower_id, updates only approved existing snapshot fields, and preserves historical Assignments.
