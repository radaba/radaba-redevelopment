# Phase 8F — Tower Bulk Import

## Scope and mode

Phase 8F adds a strictly administrator-only, create-new-Towers-only CSV workflow. It does not update, merge, upsert, delete, archive, or otherwise modify existing Towers and never writes Assignments. Bulk update is deferred.

## CSV contract

The stable columns are `tower_id`, `sitename`, `region`, `new_cluster_name`, `site_type`, `radaba_status`, `sub_region`, `province`, `kabupaten`, `kecamatan`, `roh_cluster`, `bts_type`, `enodeb_id`, `ne_name`, `antenna_type`, `antenna_system`, `txrxmode`, `latitude`, `longitude`, `g900`, `g1800`, `u850`, `u900`, `u2100`, `l850`, `l900`, `l1800`, `l2100`, and `l2300`. Required values are Tower ID, Site Name, Region, Cluster, Latitude, and Longitude.

The project-standard limits are stricter than the milestone defaults: UTF-8 CSV only, at most 1 MiB and 200 data rows. The parser accepts an optional BOM, CRLF or LF, quoted commas, escaped quotes, and a final row without a newline. It rejects empty/binary/non-UTF-8 input, malformed quoting, duplicate/unknown/missing/reordered headers, wrong column counts, and excess rows. Template and error report output use a UTF-8 BOM, CRLF, RFC4180 escaping, and spreadsheet-formula protection.

Rows reuse `parseTowerCreateInput`: strings are trimmed, Tower IDs uppercased, descriptive case preserved, optional blanks omitted, coordinates bounded, radio values constrained to 0–999, and zero preserved. Statuses are `valid`, `invalid`, `duplicate_in_file`, and `already_exists`.

## APIs and authorization

- `GET /api/towers/import/template`
- `POST /api/towers/import/validate`
- `POST /api/towers/import/commit`

Every API independently requires the existing Active `super_admin` plus strict `/privilege` administrator session. The directory hides the action for other users. Validation performs no write and returns bounded row results. Commit receives and reparses the original file, reruns all validation and conflict checks, and rejects the whole request if any row is invalid or conflicting.

## Atomicity and scaling

Validation uses one bounded Tower-ID read with a 1,000-existing-record ceiling; it never performs per-row Firebase queries. Commit reserves server push keys and runs one collection-level Firebase transaction. The transaction rechecks normalized IDs immediately before adding all new children, so a concurrent conflict aborts every write. Existing children are spread unchanged and no Assignment path is referenced.

The collection transaction matches the proven Phase 8D uniqueness architecture but is intended only for the current small Tower master. Imports are deliberately blocked when the bounded existing-record ceiling is exceeded. A future scale milestone should introduce an approved uniqueness/index strategy before raising this ceiling.

## Interface and accessibility

The six-step desktop modal/mobile full-screen workflow provides template download, labelled file selection, separate validation, summary cards, status/search filters, 25-row pagination, desktop table, mobile cards, safe error report, explicit atomic confirmation, pending guards, completion summary, directory refresh, and optional first-record link. Status is always textual, summary/progress uses live semantics, controls have practical targets and visible focus styling, and reduced-motion behavior inherits the application shell.

## Known limitations

There is no validation token; trust is preserved by sending the original `File` again and fully reparsing/revalidating it at commit. There is no Excel parser, bulk update/upsert, import audit record, Tower deletion, Assignment synchronization, or schema migration. Operational commit acceptance remains deferred unless a non-production Firebase environment or explicitly disposable IDs are available.
