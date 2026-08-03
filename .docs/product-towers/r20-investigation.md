# R20 Investigation

## Outcome

Runtime implementation stopped before archive/delete code. The schema has no supported archive convention, and complete bounded dependency proof is unavailable. Both conditions are explicit fail-closed gates in R20.

## Baseline

- Branch: `feature/login-redesign`
- Commit inspected: `14744d2c3f1dd7cc7a8107ae9d789a20719f326c`
- Worktree was already highly dirty with extensive earlier modified/untracked work. R20 changes are limited to `.docs/product-towers`.

## Tower identity and path

- RTDB path: `tower/{firebasePushKey}`.
- Route identity: the Firebase child key (`firebaseKey` / `towerKey`).
- `tower_id` is a separate business identifier and foreign-reference value.
- Assignment relates by exact `assignment.tower_id === tower.tower_id`.
- Cell may relate by `cell.tower_id`, but proven legacy records may only carry `assignment_id`.
- Tower ID is copied into Assignment snapshots and appears in Cell/report workflows. Renaming it would require a separate migration milestone.
- Current create/import transactions reject new normalized Tower ID duplicates. Legacy duplicates may still exist; `findTowerByTowerId` deliberately returns a Tower only when exactly one match exists. No production duplicate scan was performed.

## Existing status fields

No `active`, `inactive`, `archived`, `deleted`, `deleted_at`, `updated_at`, lifecycle `status`, version, or revision convention is confirmed on Tower.

`radaba_status`, `region_radaba_status`, and `sub_region_radaba_status` are operational Radaba participation/visit flags. Mobile Finished writes `radaba_status = "Yes"` and related composite values. They are not archive state and must not be repurposed.

## Existing edit capability

An administrator-protected `PATCH /api/towers/{towerKey}` already exists. `TowerCommandService.edit`:

- re-reads the Tower;
- rejects `tower_id` edits;
- normalizes only approved fields;
- skips unchanged fields;
- preserves numeric zero;
- atomically commits Tower changes and an append-only `tower_audit` event.

Limitations against R20:

- no required change reason;
- no reviewed-baseline compare-and-set; the UI truthfully documents last-write-wins;
- no `updated_at` or version field;
- network inputs accept finite decimals from 0 through 999;
- the current live `/home/towers/{towerKey}` R15C workspace intentionally exposes no edit control, while an older `TowerDetail` component contains the edit dialog;
- `/home/towers` shows View only, not Edit/Archive/Delete actions.

## Dependencies

### Assignment

Path: `assignment/{assignmentPushKey}`. Relationship uses `tower_id`. The existing related query is exact and indexed but capped at 50 (`RELATED_ASSIGNMENT_MAXIMUM_LIMIT`). This is suitable for operational display, not proof that no historical Assignment exists. Any Assignment—active or historical—must block hard delete.

Proven active states are `Open`, `Accepted`, `On Progress`, and `Paused`. Proven terminal states are `Finished`, `Rejected`, and `Dropped`; compatibility completion also recognizes `Closed`, `Completed`, `completed=true`, and completion timestamps. Revisit restores `On Progress` / `Open`.

### Cell

Path: `cell/{cellPushKey}`. Some records contain `tower_id`; others are reachable only through `assignment_id`. R15C performs bounded exact queries by Tower ID and by only the newest bounded Assignment ID, then de-duplicates. Existing R15C documentation explicitly states it cannot prove every historical Cell without querying every Assignment. Therefore the workspace query cannot authorize hard delete.

### Images

- Tower embedded images are dynamic `foto_*_name` / `foto_*_url` pairs on the Tower record itself.
- Cell embedded images use the same pairs on Cell records.
- Legacy `image/{pushKey}` records relate primarily through `assignment_id`, not a guaranteed Tower index.
- Web photo evidence uses `assignment_photo/{assignmentPushKey}/{photoId}`.

A Tower record with embedded image fields is not orphaned. Cell/image completeness cannot be proven without complete Assignment/Cell traversal or a confirmed index.

### Reports

AOR report metadata (`report_name`, `report_url`) is embedded in Assignment records. R17 lists from a bounded Assignment cohort and has no report index. Any Assignment already blocks hard delete, but the current bounded reads cannot prove none exist.

## Audit

Tower audit path is `tower_audit/{towerKey}/{auditPushKey}`. Existing audit actions are only `tower_created`, `tower_updated`, and `tower_imported`; sources are `manual_create`, `manual_edit`, and `bulk_import`. Events record actor, time, changed fields, and before/after values and are atomically committed with Tower writes.

No archive/delete action classification, reason, dependency summary, or confirmation method is supported. `tower_audit` is separate from `tower`, so an audit could survive deletion, but extending its contract requires an approved decision and tests.

## Authorization and rules

- Active users with exact `/assignment` privilege may view Tower pages/workspaces.
- Strict administrators may create, edit, and import Towers.
- No Coordinator edit or delete scope is proven.
- Riggers are view-only under current web rules.
- Firebase Admin performs server writes; browser Firebase is not used.
- No current hard-delete method or route exists.

## Mobile/Android

Mobile Finished updates selected Tower operational fields by `tower_id`. Mobile APIs and Android workflows rely on Tower/Assignment business identifiers but no archive/delete behavior exists. Removing a Tower could break mobile completion and historical navigation. No mobile route or Android code was changed.

## Gate conclusion

Archive requires an explicitly approved new lifecycle field/value contract or external authoritative convention. Hard delete requires complete, bounded, fail-closed dependency evidence. Neither exists, so R20 runtime implementation must stop.
