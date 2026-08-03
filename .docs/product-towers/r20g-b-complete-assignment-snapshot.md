# R20G-B complete Assignment snapshot

Tower edit synchronization now includes `tower_type`, `tower_height`, `total_antenna`, `total_rru`, `single_sector`, `multi_sector`, `route_distance`, and `justifikasi`. Missing fields on eligible active Assignments are backfilled when the corresponding Tower value participates in an approved edit impact. Existing values may be updated only through Tower synchronization; administrator maintenance only adds missing fields.

Historical Assignments remain immutable. Assignment audit records identify the Tower key and ID, actor, timestamp, changed fields, before/after values, reason, and originating Tower audit for edit synchronization. Maintenance audits use reason `tower_snapshot_backfill` and a bounded batch identifier.
