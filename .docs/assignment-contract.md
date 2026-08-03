# Assignment Read Contract

Phase 7A defines the typed, server-only administrative Assignment read contract. The RTDB path is exactly `assignment`; Firebase push keys remain distinct from stored `assignment_id` values. Raw snake_case fields and legacy scalar variations are preserved, and normalization never writes to RTDB.

## List contract

The normalized item contains the push key and confirmed list sources: `assignment_id`, `region`, `sub_region`, `company`, `rigger_name`, `assignment_status`, `assignment_state`, created and closed dates/datetimes, `checkin_datetime`, `completed_datetime`, and `image_total`. Missing values map to `null`. `image_total` retains its string-or-number source form. Duration is not calculated because the 39-minute adjustment and CSV Duration behavior remain unresolved.

| Time basis | Meaning | Unfiltered field |
|---|---|---|
| `onCreate` | Assignment Time | `created_date` |
| `onFinish` | Finished Time | `closed_date` |

Dates display as `DD/MM/yyyy` and query as `YYYY-MM-DD`. Server query construction uses `Asia/Jakarta`. The confirmed UI default is today minus eight days through today. RTDB `startAt` and `endAt` boundaries are inclusive; composite boundaries are `<normalized value>_<YYYY-MM-DD>`.

## Active mappings

| Filter | Created-time field | Finished-time field |
|---|---|---|
| Status | `index_created_date_assignment_status` | `index_closed_date_assignment_status` |
| Rigger Name | `index_created_date_rigger_name` | `index_closed_date_rigger_name` |
| Region | `index_created_date_region` | `index_closed_date_region` |
| Sub Region | `index_created_date_sub_region` | `index_closed_date_sub_region` |
| Partner | `index_created_date_company` | `index_closed_date_company` |

Status is special: equality on `assignment_state` is followed by an inclusive date check against the applicable status composite. Disabled UI filters are Assignment ID, Tower ID, Kab/Kota, and Kecamatan.

Legacy lists sort `created_datetime` descending without a secondary tie-break. Pagination is one-based with ten rows by default, loads the matching range before slicing, and provides neither a cursor nor an authoritative total. The Phase 7A repository retains push keys and deduplicates multi-value matches by key before pagination; this differs from legacy concatenation.

## Privilege

Server access requires an existing record where `path === "/assignment"` and `privilegeRecord[currentUser.role] === true`. Navigation visibility is not authorization. No action-level privileges are introduced.

## Unresolved production evidence

- Deployed RTDB `.indexOn` rules and representative sanitized records
- Maximum result sizes and production date-range behavior
- Finished Time filtering behavior
- Actual `/assignment` privilege record
- Legacy request-body versus query-string behavior
- Active versus obsolete filters and Photo/FTP Check usage
- Duration anomalies and the active-assignment creation defect

Phase 7A introduces no table UI, API route, write, import/export, Android workflow, storage upload, report handling, index, field, audit node, notification, or offline support.

## Phase 7C search and export

Canonical URL state adds `filterCategory`, repeated `filterValues`, `searchType`, and `searchValue`; Phase 7B category-specific filter keys remain readable. Assignment ID uses exact `assignment_id` equality. Tower ID uses `index_created_date_tower_id` or `index_closed_date_tower_id` with inclusive date-composite boundaries. Search plus the optional single filter category is post-filtered server-side without adding an RTDB index or multi-category UI.

CSV exports contain Assignment ID, Region, Sub-region, Partner, Rigger, Status, Assignment Time, Finished Time, and Image Total, in that order. Duration remains omitted. Export is limited to 5,000 rows and uses a 5,001st row only to detect overflow.

## Phase 7E bulk import
Bulk import accepts the documented strict CSV contract and reuses Phase 7D preparation. Validation writes nothing; commit requires every row valid.
