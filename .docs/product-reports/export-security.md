# Export security

Exports are generated server-side after session, exact-path privilege, strict-administrator, report-type, filter, field, and row-limit checks. CSV uses UTF-8 BOM, CRLF rows, stable selected-column order, safe quoting, and prefixes spreadsheet formulas. Null/missing values become empty cells while numeric zero and boolean false remain intact.

Responses are private, uncached, and labelled `current-filtered-bounded-result-set`. Successful exports append metadata-only `report.exported` events through the existing best-effort audit recorder. No rows or files are persisted. A failed export cannot reliably audit itself if the audit source is unavailable; the API returns a sanitized failure.
