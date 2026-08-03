# R20E Tower CSV Export and Safe Import

## R20E-B status

R20E-B Safe Tower Import Commit is completed. The bounded preview workflow now supports controlled creation of valid new Towers and changed-field-only updates of exact existing Towers. It does not delete, archive, restore, merge, repair, or migrate records.

## Routes and authorization

- UI: `/home/towers/import-export`
- CSV export: `GET /api/towers/export`
- Import preview: `POST /api/towers/import/preview`
- Import commit: `POST /api/towers/import/commit`
- Blank/example templates: `GET /api/towers/import/preview/template?examples=0|1`

Active exact Assignment privilege is required to open the page and export. Both preview and commit independently require the existing strict administrator resolver. Commit derives the audit actor from the authenticated server session. Responses are private/no-store. Uploaded files remain in memory and are not permanently stored.

## Server-side revalidation and eligibility

The browser sends the original CSV file again at commit. The server repeats extension, MIME, UTF-8, byte-size, header, row-count, field, duplicate-upload, exact Tower ID, ambiguity, optional Firebase-key consistency, and changed-field validation. Client classifications are never accepted as authoritative.

Eligible rows are `new` and `changed`. `unchanged` rows are reported without a write. Invalid, duplicate, ambiguous, and unsupported rows are blocked. The import returns a deterministic per-row result: `created`, `updated`, `unchanged`, `blocked`, `conflict`, or `failed`, including row number, Tower ID, Firebase key when resolved, changed fields, safe error code, and message.

## Create behavior

New rows reuse the existing single-Tower creation parser and approved field allowlist. Required creation values remain Tower ID, Site Name, Region, Cluster, Latitude, and Longitude. Tower IDs are normalized exactly as existing creation does. A server Firebase push key and audit push key are reserved. `createIfTowerIdAvailable` immediately rechecks normalized `tower_id` inside the root transaction, preventing retries or concurrent requests from creating a duplicate.

The Tower record and its `tower_imported` / `bulk_import` audit record commit atomically under:

- `tower/{towerKey}`
- `tower_audit/{towerKey}/{auditKey}`

## Update behavior and concurrency

Changed rows resolve the exact Firebase key from the server-side match, reread `tower/{towerKey}`, and recalculate the diff from the uploaded fields. Only supplied changed fields are passed to the existing atomic update command. `tower_id` and the Firebase key are immutable and never included in updates.

The current changed-field values form the optimistic concurrency baseline. The root transaction verifies that baseline before writing the Tower and audit. A missing or concurrently changed Tower is reported as `conflict`; it is not silently overwritten. Successful updates use the existing `tower_updated` audit action with `bulk_import` source.

## Batch, failure, and idempotency model

The existing limits remain: CSV only, at most 1 MiB, at most 200 nonblank data rows, and at most 1,000 existing Towers in the bounded exact-match scan. Rows are processed sequentially with an explicit concurrency limit of one. Each mutation is independently atomic, so one blocked, conflicting, or failed row does not corrupt another row. Partial completion is reported truthfully.

No persistent submission-token schema is added. Retry safety is provided by full server revalidation plus the transaction-time exact `tower_id` duplicate check for every create. A repeated identical file therefore resolves the previously created Tower as unchanged or changed instead of creating another Tower.

## Blank, null, zero, and immutable fields

A blank update cell means no proposed change and does not erase an existing field. `__NULL__` remains blocked because bulk field removal is not approved. Missing, blank, and null values never become zero. Numeric zero remains numeric `0`. Radio values remain bounded whole numbers and coordinates retain their existing numeric ranges.

`tower_id`, Firebase push keys, created metadata, and fields outside the existing create/edit allowlists cannot be changed by import.

## Confirmation and results

After preview, administrators open Confirm Import and must type `IMPORT TOWERS` exactly. The dialog shows new, changed, unchanged, blocked, changed-field, and warning counts and states that no Towers are deleted, unspecified fields are preserved, only valid rows are processed, and every mutation is audited. Pending guards prevent browser double submission.

Completion shows Created, Updated, Unchanged, Blocked, Conflicts, and Failed summaries plus per-row Tower links using Firebase keys. Results can be downloaded as UTF-8 BOM CSV with spreadsheet-formula protection.

## Export and transfer security

Stable machine headers and the existing bounded 100-row export remain unchanged. Unsupported and dangerous headers are rejected. There is no arbitrary-object API, fuzzy matching, collection scan beyond the bound, raw Firebase error leakage, upload persistence, or null-to-zero coercion.

## Known limitations

- CSV only; XLSX is not supported.
- Export remains bounded to 100 rows.
- Matching stops when more than 1,000 Towers are encountered.
- Import is limited to 200 rows and sequential processing.
- Idempotency does not add a persistent batch ledger; it relies on authoritative revalidation and transaction-time Tower ID uniqueness.
- Blank cells cannot remove existing optional fields.
- No Tower delete, archive, restore, duplicate merge/repair, Assignment/Cell/image/report import, schema migration, or dependency-index persistence is implemented.