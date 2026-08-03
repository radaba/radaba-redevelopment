# Phase 9A — Read-Only Rigger Directory and Detail

## Delivered scope

Phase 9A adds `/home/riggers` and `/home/riggers/[riggerKey]`, plus independently authorized `GET /api/riggers` and `GET /api/riggers/{riggerKey}` endpoints. The UI includes URL-backed keyword, status, and company filters; 25/50/100 cursor pages; responsive table/cards; profile and organization fields; bounded workload and history; and links to existing Assignment and Tower surfaces.

## Proven data contracts

- Rigger records remain Firebase push-key children under `user`.
- A Rigger is identified by the existing Assignment picker rule: trimmed `position`, compared case-insensitively with `rigger`. Directory membership does not require Active status, so inactive historical records remain inspectable.
- Displayed fields are existing `user` fields only: `uid` is used internally but not displayed; name, email, phone, role, position, status, company, department, region, `sub_region`, `office_location`, type, `join_date`, `create_date`/`created_date`, and `create_datetime` are mapped without schema changes.
- Assignment association uses normalized exact `user.email` to `assignment.rigger_email`. Detail candidates use the existing `index_created_date_rigger_name` prefix for the exact stored name and then require the email match. No inferred name-only fallback is used.

## Authorization and privacy

Pages and APIs reuse the verified, revocation-checked Assignment session boundary: exact Active account status and strict `/assignment` privilege. There is no administrator bypass. Navigation uses the same permission flag. Responses are private/no-store, expose mapped DTOs rather than raw snapshots, and provide no write verbs or write controls.

## Bounded reads

- Directory traversal uses stable `orderByKey` cursors, a maximum 500-user scan per request, and page sizes 25, 50, or 100.
- Directory workload performs one bounded newest-key Assignment read (maximum 1,000) and groups by normalized Rigger email in memory; it does not issue one query per row.
- Detail history reads at most 21 indexed candidates to return 20 recent matches (hard repository maximum 50).
- UI counts are explicitly current-result or bounded-window counts, never global totals. Limit warnings disclose possible incompleteness.

## Compatibility and failure behavior

No RTDB paths, field names, field types, query indexes, records, Authentication users, privileges, or Android contracts are changed. Sparse values render as unavailable. Invalid keys/queries are rejected. Missing or non-Rigger children return not found. Assignment-read failure leaves the profile usable and states that no data changed.

## Verification

`tests/riggers/phase-9a-riggers.test.js` covers identity casing, inactive membership, sparse mapping, query bounds, read-only source checks, workload bounding/no-N+1 structure, independent API authorization, navigation, responsive UI surfaces, cross-links, and absence of an administrator bypass. `scripts/validate.cmd` includes this suite before type-check and production build.
