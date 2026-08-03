# Migration and versioning

## v1

`/api/mobile/*` is an exact compatibility bridge. Legacy quirks, status codes,
empty values, errors, paths, and Android DTO shapes are preserved.

## Future v2

`/api/mobile/v2/*` may introduce token and ownership enforcement, bounded
queries, normalized errors, secure logging, idempotency, and atomic workflows.
It is not implemented in M4R.

Android cutover requires full 20-route coverage, golden DTO tests, staging
against a non-production Firebase project, app-version telemetry, rollback
drill, and explicit approval. Rollback currently means routing traffic back to
the legacy deployment or removing the compatibility App Router route directories.

M6R rollback additionally removes `getCellDetailsPerSector` and `getUtility`
route directories and their compatibility-only support modules. Android cutover
remains blocked pending full route coverage and staging approval.

## M9R-B rollback

Remove the updateAssignmentDetails route and its transition-only modules, fixtures, and tests. No database migration is involved. Android cutover remains blocked.


## M9R-C rollback

Remove the finish service/repository/fixtures/tests and Finished dispatch wiring. No schema, dependency, Android, or data migration rollback is required.


## M9R-D readiness gate

Cutover remains conditional. Keep rollback routing, prohibit blind lifecycle retries, and resolve deferred Accepted/Checkin/Go/completed/close-by-ID evidence plus an approved partial-state operating procedure before legacy shutdown.

## M10R rollback and readiness

Rollback removes updateCellDetails and its command repository, service, handler, fixture, tests, and documentation. No schema or data rollback is required. Cutover remains blocked by deferred routes and staging approval.

## M11R gate

Do not enforce until Android stores/refreshes the ID token, sends Bearer authentication, handles 401/403, and passes staging. Follow the eight-stage plan in ../mobile-api-security/m11r-rollout-plan.md; no stage was executed in M11R.

## M12R readiness gate

Local shadow validation does not authorize cutover. Before device staging, implement and characterize the three missing Android-called routes, resolve deferred lifecycle actions, and separately approve Android Bearer integration. Then run staging observe, device DTO/error/retry scenarios, measured performance, selected enforcement, and rollback rehearsal. Production remains on the legacy endpoint.

## M13R production preparation

Operational controls and rollback documentation now exist, but rollout remains 0 and legacy-compatible. Resolve M12 route/Android/staging blockers, connect approved telemetry, rehearse rollback, and obtain explicit change approval before any deployment or endpoint migration.
