# R20G — Tower Impact Analysis and Assignment Synchronization

## Decision

Tower edits remain keyed by `tower/{pushKey}`. Assignments relate through the established immutable business field `assignment.tower_id === tower.tower_id`; no Tower-key fallback or new Assignment relationship field is introduced.

The edit review calls administrator-only `POST /api/towers/{towerKey}/assignment-impact`. The server rereads and validates the Tower, performs an exact bounded Assignment query, classifies lifecycle state, and returns a write-free impact summary plus an opaque impact token. The existing PATCH endpoint accepts `assignmentSync.mode` (`none` or `eligible`) and recalculates impact at commit. Omission defaults to `none` for compatibility.

## Eligibility

Active `Open`, `Accepted`, `On Progress`, and `Paused` Assignments without completion evidence are eligible. `Finished`, `Rejected`, `Dropped`, status `Closed`/`Completed`, completion flags, and completion timestamps are historical and preserved. Unknown lifecycle combinations block eligible synchronization. The UI defaults to **Update Tower only**.

## Allowlist

Eligible records may synchronize only existing `sitename`, `site_type`, `latitude`, `longitude`, `region`, `sub_region`, `province`, `kabupaten`, `kecamatan`, `new_cluster_name`, `bts_type`, `antenna_system`, `antenna_type`, `g900`, `g1800`, `u900`, `u2100`, `l850`, `l900`, `l1800`, `l2100`, and `l2300` fields. Missing fields remain missing. Geography changes rebuild only existing `index_created_date_*` composites. `tower_id`, workflow/people/report/evidence fields, and `u850` are excluded. `l850` and `l2300` use the existing lowercase numeric legacy fields consumed by Android workflows; numeric zero is preserved.

R20G-C explicitly excludes `tower_type`, `tower_height`, `total_antenna`, `total_rru`, `single_sector`, `multi_sector`, `route_distance`, and unresolved `justifikasi` from Tower-origin synchronization. The seven confirmed Full Tower fields belong to the Assignment-linked `/image` form. A Tower edit must not overwrite them.

## Atomicity, concurrency, and audit

Eligible mode uses one Firebase root transaction. It rechecks the Tower baseline, relationship cohort, lifecycle, 100-record safety bound, and impact token before atomically writing the Tower, Tower audit, eligible Assignment fields, and `assignment_audit/{assignmentKey}/{auditKey}` events. The transaction handles Firebase's initial null callback without treating it as authoritative NOT_FOUND. Any conflict, unknown lifecycle, overflow, or missing audit identity aborts the entire write.

Tower audits include synchronization mode and related/updated/preserved/blocked counts. Assignment audits contain only changed synchronized fields, source Tower identities, originating Tower audit ID, trusted actor, and timestamp.

## Compatibility and limitations

Paths, push keys, `tower_id`, field names, scalar types, missing values, zero values, and historical records are preserved. Android continues reading the existing Assignment shape. No RTDB rule/index is added; deployed `.indexOn` coverage for `assignment.tower_id` remains unproven. Preview reads at most 101 matches and fails closed above 100. A future rules/index and reconciliation milestone is recommended.
