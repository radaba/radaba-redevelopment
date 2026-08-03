# Cell model

Cell records are `cell/{pushKey}`. `rcell_id` is a generated business identity, not the Firebase key. Android generates `sector_<number>_<lowercaseBand>_<assignmentId>`; finish repeats this formula for radio-loop completion (`mobile-assignment-finish-service.mjs:206-212`).

Reads query `assignment_id` or `rcell_id` (`firebase-mobile-cell-repository.ts:17-40`). Writes query every exact `rcell_id` match, update all matches, or `push()` a new record (`firebase-mobile-cell-command-repository.ts:23-38`). This is retry-tolerant only if no concurrent create occurs and existing duplicates are acceptable. No transaction, unique index, compare-and-set, delete, archive, or reconciliation is present.

Cells are downstream per-sector/per-band materialization. R20G-C does not count Cell rows to derive radio totals or Full Tower fields, and does not use `cell.tower_height` as canonical Tower height: legacy duplication exists and downstream output may substitute `antenna_height`. Radio-count changes can therefore leave extra, missing, duplicate, or orphan Cell rows; reconciliation is deferred to proposed milestone R20H.
