# Performance and scope

Preview is capped at 75 rows and export at 500 rows. Operational roots use `orderByKey().limitToLast(501)`. Cross-source Rigger performance uses two bounded reads and an in-memory merge; it does not read Cells or Images. User identity health avoids per-user Auth calls.

This is a bounded result, not a complete database export. Older matches may be absent. Complete export needs reviewed indexed queries or a separately approved reporting index; no schema/index migration is introduced here.
