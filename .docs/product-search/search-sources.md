# Search sources

- Assignment: `assignment`, fields `assignment_id`, `tower_id`, `sitename`, rigger/coordinator/RNO names and email, company, status and category.
- Tower: `tower`, fields `tower_id`, `site_id`, `sitename`, `ne_name`, `enodeb_id`, location and region fields.
- Cell: `cell`, fields `rcell_id`, `assignment_id`, `tower_id`, `sitename`, band, sector and rigger name.
- Rigger/User: `user`, fields name, email, company, phone, region; User also UID, role and status. Riggers require stored `position === Rigger`.
- AOR Report: existing Assignment-backed `report_name`, assignment/tower IDs, rigger/coordinator and company. Routes use the existing report hash from the Assignment Firebase key, never a guessed business ID.

Existing entity repositories use indexes such as `assignment_id`, `tower_id`, `rcell_id`, user email/name, and composite Assignment date indexes. Global multi-field case-insensitive search cannot use those as one query, so this milestone reads only the newest 200 push-key records per authorized root using `orderByKey().limitToLast(200)` and filters them in memory.
