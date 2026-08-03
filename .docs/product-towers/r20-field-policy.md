# R20 Tower Field Policy

## Immutable

- Firebase child key / route `towerKey`.
- `tower_id` business identifier. It is copied into Assignments and used by Cell, report, mobile, and audit relationships. Rename belongs to a migration milestone.

## Existing editable fields

The current edit contract approves:

- identity/display metadata: `sitename`, `site_type`, `radaba_status`, `new_cluster_name`;
- geography: `region`, `sub_region`, `province`, `kabupaten`, `kecamatan`, `roh_cluster`;
- coordinates: `latitude`, `longitude`;
- network/site metadata: `bts_type`, `enodeb_id`, `ne_name`, `antenna_type`, `antenna_system`, `txrxmode`;
- sector counts: `g900`, `g1800`, `u850`, `u900`, `u2100`, `l850`, `l900`, `l1800`, `l2100`, `l2300`.

`radaba_status` is editable only in its existing operational meaning; it is not lifecycle status.

## Conditional rules

- `sitename`, `region`, `new_cluster_name`, latitude, and longitude are required by the existing edit contract.
- Optional blanks remove optional fields using existing absence semantics.
- Zero is valid for coordinates and sector counts.
- Assignment snapshots are never rewritten by Tower edits.
- Network configuration synchronization remains separately blocked under R19.

## Derived/historical

Composite fields such as `region_radaba_status` and `sub_region_radaba_status` are mobile operational derivatives and should not be exposed as generic lifecycle fields. Audit events are historical and append-only.

## Sensitive/unapproved

Unknown fields, credentials, private URLs, archive/delete metadata, and arbitrary client-selected fields are not editable. A lifecycle field must not be added without explicit schema approval.
