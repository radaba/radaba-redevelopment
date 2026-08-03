# Phase 7C: Assignment Search and CSV Export

Phase 7C remains read-only. Assignment reads and CSV generation are server-authorized; no Firebase object, role assertion, raw privilege payload, or write method crosses into the browser.

## Supported search

- Assignment ID: exact equality on `assignment_id`, followed by the active date and optional single-category filter checks.
- Tower ID: inclusive date-composite query on `index_created_date_tower_id` for Assignment Time or `index_closed_date_tower_id` for Finished Time.

Search values are trimmed, limited to 200 characters, debounced for 500 ms, and stored in `searchType` and `searchValue`. No unrelated free-text search exists. Deployed `.indexOn` support for both Tower ID composites still requires production confirmation; repository errors are surfaced instead of downloading the complete Assignment node.

## URL contract

Canonical Phase 7C parameters are:

```text
timeBasis=onCreate|onFinish
startDate=YYYY-MM-DD
endDate=YYYY-MM-DD
page=positive integer
pageSize=10|25|50
filterCategory=status|region|sub_region|company|rigger_name
filterValues=value
searchType=assignmentId|towerId
searchValue=value
```

Repeated `filterValues` are accepted. The Phase 7B category-specific keys remain readable for reload compatibility, but new client navigation writes the canonical parameters. Invalid values fall back to safe defaults. Changing search, filter, dates, or page size resets the page to one.

## CSV contract

`GET /api/assignments/export` verifies the Firebase session and exact `/assignment` role privilege before using the server-only repository.

The deliberately adopted Phase 7C headings and order are:

```text
Assignment ID, Region, Sub-region, Partner, Rigger, Status,
Assignment Time, Finished Time, Image Total
```

This is a compatibility decision made without an available legacy CSV source. Duration is omitted because its legacy 39-minute anomaly and meaning remain unresolved. Dates preserve the stored `YYYY-MM-DD` list values. The filename is `radaba-assignments-YYYY-MM-DD.csv`, using the Jakarta date.

CSV uses commas, CRLF records, RFC 4180 quoting, doubled embedded quotes, and a UTF-8 BOM for legacy Excel compatibility. Cells beginning with `=`, `+`, `-`, or `@` are prefixed with an apostrophe to prevent spreadsheet formula execution.

## Export policy

Exports require the active date range and preserve the active search and single filter category. The synchronous maximum is 5,000 rows. The repository reads at most 5,001 matching rows for overflow detection and returns a friendly `413` response when the limit is exceeded. No background job or unbounded full-node fallback is introduced.

## Production confirmations

- Deployed indexes for `assignment_id`, `index_created_date_tower_id`, `index_closed_date_tower_id`, and active filter composites
- Representative legacy CSV comparison
- Finished-time behavior
- Excel behavior with operational data
- Maximum range performance at 5,001 rows
