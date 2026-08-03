# Phase 7E â€” Bulk Assignment import

Phase 7E is non-production code until Phase 7D creation/reassignment and this import are manually verified against an approved non-production Firebase target.

## Format

Only `.csv` is accepted. Files must be UTF-8, may contain a BOM, may use CRLF or LF, must not exceed 1 MiB, and may contain at most 200 nonblank data rows. Canonical headings and order:

```csv
tower_id,rno,rigger,coordinator,category,plan_date,description
```

The first five values are required. User columns contain exact email identifiers. `plan_date` is optional `YYYY-MM-DD`; `description` is optional and limited to 2,000 characters. Surrounding whitespace is trimmed. Fully blank rows are ignored. Header whitespace is trimmed and headings are compared case-insensitively before normalization to canonical lowercase. Unknown, missing, duplicate-normalized, or reordered headings, malformed quoting, extra columns, invalid UTF-8, unsupported MIME types, duplicate normalized towers, and duplicate normalized rows are rejected.

The protected template endpoint returns `radaba-assignment-import-template.csv`, a BOM-prefixed RFC 4180 CSV with CRLF. It preserves the exact seven-column heading order and includes five clearly non-production reference rows using email-shaped user identifiers and ISO `YYYY-MM-DD` dates. Users remove these samples before importing their own records; parsing, reference validation, limits, and commit behavior are unchanged.

## Validation and commit

`POST /api/assignments/import/validate` parses and resolves the uploaded file without writing. `POST /api/assignments/import/commit` receives the original file again, repeats all parsing, reference, role, category, collision, and active-tower checks, prepares every record through Phase 7D `prepareCreateAssignment`, and writes only when every row is valid.

Every endpoint re-verifies the session, re-reads the Active user, and requires strict `/assignment` privilege access. Administration rights do not imply import rights. Client roles, actors, timestamps, IDs, status, state, company, geography, and composites are never accepted.

Tower resolution uses exact uppercase `tower_id`. RNO, rigger, and coordinator resolution uses exact normalized `user.email`, explicitly approved as the Phase 7E import identifier; Phase 7D eligibility rules remain authoritative. Category uses the exact legacy name. A request-scoped repository caches repeated key/category reads. No full collection is sent to the browser.

Duplicate towers or identical normalized rows are validation errors. Active Assignment conflicts are row errors and never mutate existing records. Invalid batches perform no writes. Valid batches reserve unique push keys, build complete records, and use one root multi-location update under `assignment/<push-key>`.

The policy is all-or-nothing before the final update. RTDB applies the multi-location update atomically, but conflict queries and that update cannot share a transaction without a new lock node. Concurrent creates remain a race. If the response to a final update is lost, retry may duplicate records; client pending guards prevent clicks but full idempotency is not claimed.

## UI

`AssignmentImportDialog` provides Select, Preview, Validate, Confirm, Import, and Results stages. File selection never writes. The browser parser is preview-only; the server reparses the original file. Results include totals, `canCommit`, normalized safe inputs, resolved display values, and structured field-level codes/messages. Invalid rows can be downloaded as a formula-safe CSV containing only row number, tower ID, status, error code, field, and message.

The dialog uses the shared focus-trapped shell, live announcements, labelled controls, disabled pending actions, a contained desktop table, and mobile result cards. State is local and is not persisted.

## Non-goals and production confirmation

No XLSX, partial-success mode, background jobs, persistent import records, lock nodes, Android workflow actions, bulk delete, or client Firebase write is included. Manual non-production checks remain required for successful batches, exact fields, conflict immutability, final-write failure/retry, permissions, keyboard/mobile behavior, Excel error-report handling, and absence of unrelated RTDB changes.

## Corrective contract details

Calendar dates are validated as real dates, not only numeric shapes. Duplicate complete rows and duplicate towers receive distinct codes and every affected row is invalid. File/row limits map to 413, row validation failure to 422, and data changed after validation to 409. Commit detects duplicate prepared IDs or push keys and rechecks every prepared tower immediately before the final update. Assignment IDs remain unique within a valid batch because duplicate towers are prohibited and tower ID is part of the legacy ID; collisions are also explicitly rejected before writing.

Error reports use `row_number,tower_id,status,error_code,field,message` and the dated filename `radaba-assignment-import-errors-YYYY-MM-DD.csv`.
