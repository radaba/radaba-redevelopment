# M9R-C Finished workflow map

Actual legacy behavior:

1. Generate Jakarta date and datetime before validation.
2. Query `assignment` by body `assignment_id`; use the first match.
3. Return HTTP 200 not-found string if absent.
4. Query `user` by the stored Assignment `rigger_email`; use first match.
5. For nine radio bands, iterate sectors `1..Number(stored count)`.
6. Query `cell` by generated `rcell_id`; sequentially update every match or
   push a new Cell with `closed_date`, `closed_datetime`, and `rcell_id`.
7. Query `image` by stored `assignment_id`; sequentially close every match.
8. Query `tower` by stored `tower_id`; sequentially set Radaba status indexes.
9. If the first user read found a user, query `user` again and sequentially
   update every match.
10. Build and update the first Assignment match.
11. Concurrently start productivity and rigger-achievement work.
12. For each stakeholder (National, mapped region, and CCSI company), query and
    transaction daily, hourly, and weekly productivity rows.
13. Query and transaction the monthly rigger/day achievement row.
14. Return the exact Assignment update object after all transactions resolve.

There is no current-state check, Cell/image completeness validation, ownership
check, pause-duration calculation, SLA calculation, history/log write, retry,
compensation, or atomic multi-location update. Android uploads the PDF before
calling this route; the route does not generate or transport the report.

Android sends `images_status`, but the legacy branch reads singular
`image_status`; the returned/stored `image_status` is therefore normally the
empty string. This defect is preserved.

