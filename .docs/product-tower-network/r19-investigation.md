# R19 Investigation

## Outcome

Runtime implementation is stopped by the milestone safety gate. The value meaning is confirmed, but safe Android refresh/resync after an active Assignment snapshot change is not.

## Baseline

- Branch: `feature/login-redesign`
- Commit inspected: `14744d2c3f1dd7cc7a8107ae9d789a20719f326c`
- Worktree: already highly dirty, with many modified and untracked files from earlier milestones. R19 investigation changes are limited to this documentation directory.

## Exact RTDB paths

- Current Tower records: `tower/{towerPushKey}` (`TOWER_RTDB_PATH = "tower"`).
- Assignment snapshots: `assignment/{assignmentPushKey}` (`ASSIGNMENT_RTDB_PATH = "assignment"`).
- Existing append-only Tower audit: `tower_audit/{towerPushKey}/{auditPushKey}`.
- No R19 synchronization node exists or was added.

## Fields and types

Both Tower and Assignment records use exact legacy fields `g900`, `g1800`, `u900`, `u2100`, `l900`, `l1800`, and `l2100`. Tower also supports `u850`, `l850`, and `l2300`; current Assignment detail exposes the seven listed fields, while mobile finish/image flows also recognize `l850` and `l2300`.

Persisted legacy values may be number, numeric string, null, or absent. Current Tower create/import normalizes accepted values to numbers. Tower mapping deliberately preserves legacy scalar types. Assignment creation copies Tower fields without renaming or type conversion.

## Confirmed meaning

The fields are **number of sectors per band**. Evidence:

1. Legacy validation names its predicate `isNumberNumSectorPerBand` for these fields.
2. Tower UI uses “Sector” inputs.
3. Mobile image and Finished flows iterate from sector 1 through the band value and build `rcell_id` values such as `sector_1_g900_{assignment_id}`.
4. Legacy TypeScript Tower models type the values as numbers.

Therefore `l1800 = 3` means three LTE 1800 sectors, not carriers, cells, radio units, or a presence flag.

## Current Tower behavior

Tower detail already renders Radio Configuration. Administrator-only Tower editing already includes radio fields, preserves zero, applies changed fields only, and atomically commits Tower plus Tower audit. However:

- the generic edit contract accepts finite decimals; it does not enforce integers;
- accepted range is 0 through 999;
- a change reason is not required;
- the transaction does not compare a client-reviewed baseline and therefore does not provide R19 optimistic conflict detection;
- the UI calls the action “Edit Tower”, not the R19-specific controlled workflow.

Current security uses server-side `resolveAdministrator()` for PATCH. Active users with exact `/assignment` privilege may view Tower workspace data. No Coordinator Tower-edit scope is proven.

## Assignment snapshot behavior

`AssignmentCommandService.prepareCreateAssignment` resolves `tower/{key}` and copies the approved `towerFields`, including all legacy band counts, into the new `assignment/{key}` record. This confirms Tower-current → Assignment-snapshot behavior at creation. Import reuses the same service. The Assignment detail maps the seven values directly from the Assignment record.

The create service also rejects a second non-terminal Assignment for the same Tower, so the current web creation path permits at most one simultaneous active Assignment per Tower. Legacy or externally written data may still contain duplicates; bounded reads must not assume uniqueness.

No direct Assignment network editor exists. Reports do not reference these fields in the current R17 report contract. Mobile Finished and image flows do reference the Assignment snapshot values to create/update sector-related Cell rows.

## Status evidence

Canonical stored states are `Open`, `Accepted`, `On Progress`, `Paused`, `Finished`, `Rejected`, and `Dropped`. Mobile transitions set Rejected and Dropped to `assignment_status = Closed`. Web completion writes `assignment_state = Finished`, `assignment_status = Completed`, and `completed = true`. Revisit changes a completed record back to `On Progress` / `Open`.

The existing shared terminal predicate treats `Finished`, `Rejected`, and `Dropped` as terminal for creation conflict checks. Completion compatibility also recognizes `Closed`, `Completed`, `completed=true`, and completion timestamps. No `Assigned`, `In Progress`, `Cancelled`, `Archived`, or persisted `Revisit` state is proven.

Because R19 synchronization could create/delete expected sector work, no synchronization eligibility is approved until Android refresh behavior is known. Unknown statuses must always be skipped.

## Android/mobile dependency

Confirmed:

- `getassignmentsById` returns the raw first matching Assignment record, so exact field names and scalar types pass through unchanged.
- `getCardCategory`, image writes, and Finished processing consume band sector counts.
- Mobile transition routes do not update these band fields.
- Existing route and DTO characterization covers numeric-like Assignment fields.

Not confirmed:

- when an active Assignment is fetched again after initial download;
- whether Android caches the Assignment locally;
- whether a refresh rebuilds sector/photo cards safely;
- whether locally entered sector work survives a changed count;
- whether decreasing a count leaves orphaned local/server Cell or image data;
- whether the deployed APK calls the App Router route or legacy production route for refresh;
- device/emulator behavior after a mid-work Assignment update.

The available legacy repository contains web/mobile API evidence but no Android Java/Kotlin source. Existing docs explicitly say coverage is contract coverage, not live Android integration.

## Activity and concurrency evidence

There is no reliable online/offline or active-session signal. Assignment timestamps, Cell/image writes, and comments can indicate activity but cannot prove presence. No general Assignment `version`, `revision`, or reliable `updated_at` protects these fields. Any future synchronization must compare exact reviewed Tower and Assignment field values inside a transaction and re-check status and Tower identity.

## Audit and rules

Existing Tower audit is append-only and atomic with Tower writes, recording actor, time, changed fields, before, and after. It does not currently require a reason or store per-Assignment synchronization results. Assignment has no approved general audit collection. Broadening audit shape or adding a synchronization node requires a separate supported contract decision.

Firebase Admin server writes bypass browser rules. Browser Firebase is not used. `storage.rules` is unrelated. No database rules deployment was performed.

## Safety-gate conclusion

Field meaning is confirmed. Android dependency is not. Per R19 instructions, controlled Assignment synchronization, synchronization UI/API, and schema additions must not be implemented until the Android refresh/resync behavior is proven with source and device/staging characterization.
