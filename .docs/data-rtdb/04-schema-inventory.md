# Schema inventory

RTDB schemas are open legacy records, not closed relational schemas. `RawTowerRecord` is an arbitrary object and Tower scalar values allow string/number/boolean/null (`src/features/tower/tower-types.ts:1-30`). `RawAssignmentRecord` uses `LegacyAssignmentScalar = string | number | boolean | null | undefined` (`assignment-types.ts:1`).

Core exact fields:

- Tower: `tower_id`, `sitename`, `site_type`, `latitude`, `longitude`, `region`, `sub_region`, `province`, `kabupaten`, `kecamatan`, `new_cluster_name`, `bts_type`, `antenna_system`, `antenna_type`, radio fields, `radaba_status`, composite status fields.
- Assignment: identifiers/ownership, category, dates, `assignment_state`, `assignment_status`, `completed`, pause/check-in/close fields, report fields, `image_total`, radio snapshot, composite indexes, optional revisit/checklist/work-report children.
- Cell: `rcell_id`, `assignment_id`, `tower_id`, dynamic form/antenna/RRU/alignment fields, timestamps, and embedded `foto_*_(name|url)` pairs.
- Image: one push record per Assignment in intended behavior, with `assignment_id` plus dynamic metadata fields; duplicates remain possible.
- User: UID/profile/role/status/organization/region fields plus operational `radaba_status` composites.

Empty string, null, absence, numeric string, and number are not globally equivalent. Actual production frequency is Unknown.
