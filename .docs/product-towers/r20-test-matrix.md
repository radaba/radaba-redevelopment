# R20 Test Matrix

## Existing evidence

- Tower ID immutability.
- Approved edit normalization and zero preservation.
- Coordinate/radio bounds.
- Changed-field-only Tower updates.
- Administrator-only PATCH.
- Atomic Tower plus audit writes.
- Bounded related Assignment and Cell workspace queries.
- Mobile Tower update path and report read regressions.

## Required before runtime R20

Update: required reason, exact baseline conflict, unchanged result, approved fields, snapshot non-mutation, responsive live workspace UI.

Dependencies: complete/overflow states for Assignment, Cell, every image representation, report, duplicate Tower ID, malformed relation, and injected query failure.

Archive: approved field/value contract, missing-field compatibility, active-work block, historical access, restore decision, audit, and no related writes.

Delete: orphan success, every dependency blocker, unknown/overflow blocker, wrong confirmation, concurrent dependency insertion, surviving audit, no cascade, and no Storage operation.

Regression: list/detail/map/lookups, Assignment creation/snapshots, Cell/image/report/mobile flows, TypeScript, ESLint, build, route manifest, whitespace, and secret scan.

No R20 runtime tests were added because implementation is gated.
