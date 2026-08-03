# Query and index analysis

Important queries include:

- `tower` by key, exact/prefix `tower_id`, and bounded key scans (`firebase-tower-repository.ts:32-57`).
- `assignment` by `assignment_id`, `tower_id`, state, date and many composite `index_*` fields; global/recent lists are bounded (`firebase-assignment-repository.ts:89-247`).
- `cell` by `assignment_id`, `rcell_id`, or bounded key page.
- `image` by `assignment_id`.
- `user` by `email`, `name`, or bounded key page.
- comments/audits/photos by key with `limitToLast`.
- reports from a 200-record recent Assignment window or scoped limits.

No RTDB rules/index declaration is present, so `.indexOn` coverage cannot be proven. Admin queries may run unindexed with warnings and scans. Bounded queries cannot prove absence, totals, uniqueness, dependency completeness, or complete history.
