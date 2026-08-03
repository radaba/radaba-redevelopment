# R17 investigation

1. Report metadata is stored in existing `assignment` records.
2. The mobile Finished workflow writes `report_name` and `report_url`.
3. No separate `report` or `reports` RTDB node is proven.
4. The PDF URL field is `report_url`; `download` is a presentation/export column.
5. Filename is stored separately as `report_name`.
6. `assignment_id` is stored on the same record and is not parsed from the filename.
7. `tower_id` is not unique across history. Multiple Assignments for one Tower can produce
   multiple reports.
8. The current contract supports one report name/URL pair per Assignment record.
9. Proven dates are `closed_date` and `closed_datetime`; no report-specific generated timestamp
   is proven.
10. Storage objects use `report/AOR_<assignment_id>.pdf`.
11. Authorization is the established Active user plus strict `/assignment` privilege.
12. Existing direct download behavior uses the authorized page's tokenized URL.
13. Existing Assignment CSV protection is reused conceptually: metadata export is formula-safe
   and excludes URLs.
14. RTDB has no report index. R17 uses a bounded recent Assignment window and server-side
   filtering.
15. Storage existence cannot be verified without fetching the object. Metadata may be missing,
   malformed, duplicated, or reference a missing object.
16. Slash dates such as `6/5/2026` are ambiguous without a proven locale. R17 preserves and
   displays the raw value and warns instead of sorting it as a normalized date.
