# R15A Tower, sector, and band model

The relationship is Assignment → Tower/visit → many Cell records. A Cell is
one sector-band operational record, so a Tower may contain many sectors and a
sector may contain G900, L850, L1800, or other separate band records. UI
grouping sorts by sector and then band and must never collapse those records.

Cell identity has separate roles:

- database key: Firebase child key; stable lookup and `/home/cells/[cellKey]`
  route identifier
- business identifier: persisted `rcell_id`
- display identifier: `rcell_id`, with database key also shown
- image source identity: source record type plus database key

Duplicate `rcell_id` values do not merge Cells. Tower references may be
resolved from persisted `tower_id` or bounded Assignment context and may be
missing. The model performs read-only normalization and does not add, rename,
move, or rewrite RTDB fields.
