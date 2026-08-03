# Phase 8G — Tower Audit History

## Investigation and model decision

The existing `administrator_audit` infrastructure was reviewed but is unsuitable for Tower history: its documented write policy is best-effort after an administrative mutation, its read center is administrator-only, and its current repository reads the whole collection. Tower history requires atomic business/audit writes, field-level per-Tower pagination, and Active `/assignment` operational reads.

Phase 8G therefore introduces one scoped append-only storage branch:

```text
tower_audit/{towerKey}/{auditKey}
```

Each record contains `audit_id`, `entity_key`, `tower_id`, `action`, `source`, `actor_uid`, `actor_email`, `actor_name`, `occurred_at`, `changed_fields`, `before`, and `after`. Audit IDs are Firebase push keys. Actor fields come only from the verified session, timestamps come from the server clock, and actions/sources are fixed by the command path.

Supported actions are `tower_created`, `tower_updated`, and `tower_imported`. Sources are `manual_create`, `manual_edit`, and `bulk_import`.

## Change detection and atomicity

Create/import events record only populated canonical Tower fields, with old values represented as absent/null. Edit reuses the Phase 8E normalized minimal patch, and records only fields whose normalized scalar values changed. Zero is preserved. Optional-field removal records the previous scalar and a null new value. A no-change edit writes neither Tower nor audit data.

Tower and audit branches are siblings. Create, edit, and import therefore use one Firebase root transaction so both branches commit or neither does. Create/import transactions recheck normalized Tower ID uniqueness. Bulk import creates one compact audit record per Tower in the same transaction and retains the 200-row and 1,000-existing-Tower ceilings.

Root transactions are more expensive than the previous Tower-only transaction. This is the unavoidable compatibility cost of atomic sibling-node history without modifying Tower records or adding an index/locking schema. Revisit the approved storage/uniqueness architecture before substantially increasing Tower, Assignment, or import volume.

## Read experience

Active users with strict `/assignment` access can open `/home/towers/{towerKey}/history` or `GET /api/towers/{towerKey}/history`. There is no administrator bypass. Reads are server-only, scoped to one Tower, newest-first, and use push-key cursor pagination with page sizes 25, 50, or 100. Malformed events are skipped safely and actor information requires no User lookups.

The timeline shows authoritative actor, time, source, canonical/readable field names, explicit old/new labels, and expandable details. Action/source/field filters apply truthfully to the current bounded page. Summary counts are labelled as page-local. A Tower without events says it may predate audit tracking; no backfill or fabricated creation event is generated.

CSV history export is deferred because a complete bounded export contract and index/date-range policy are not yet proven.

## Immutability and limitations

There is no audit POST, PATCH, PUT, DELETE, correction, rollback, restore, export, or backfill endpoint. Only trusted Tower command repositories can append audit records. The UI exposes no mutation control. Existing Towers start accumulating history only after Phase 8G deployment.

Automated validation uses fixtures and static repository boundaries and does not connect to operational Firebase. Manual create/edit/import audit acceptance remains deferred unless explicitly disposable data or a non-production Firebase environment is available.
