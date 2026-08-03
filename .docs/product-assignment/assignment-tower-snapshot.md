# Assignment Tower snapshot

R20G-C keeps Assignment Detail snapshot-based while correcting each field's canonical source.

| Owner | Fields | Assignment lifecycle |
| --- | --- | --- |
| `/tower` | site/location, `site_type`, `bts_type`, `antenna_system`, `antenna_type`, `g900`, `g1800`, `u900`, `u2100`, `l850`, `l900`, `l1800`, `l2100`, `l2300` | Copied at creation; eligible active Assignments may be synchronized after explicit Tower impact review. |
| `/image` Full Tower form | `tower_type`, `tower_height`, `total_antenna`, `total_rru`, `single_sector`, `multi_sector`, `route_distance` | Initially absent; exact `assignment_id` image create/update synchronizes the active Assignment without type coercion. |
| `assignment` | workflow, people, report/evidence references, and all copied snapshots | Detail reads this record only; there is no live Tower, Image, or Cell fallback. |
| `/cell` | per-sector/per-band operational values | Downstream materialization only; never reverse-counted into Assignment or Tower aggregates. |
| unresolved | `justifikasi` | Excluded until its exact persisted Image key, type, and read-back contract are proven. |

Full Tower synchronization preserves numeric-looking strings, string `"0"`, numeric `0`, and unrelated Assignment fields. Missing, null, undefined, and blank-string values are not copied. Active states are `Open`, `Accepted`, `On Progress`, and `Paused`; historical Assignments remain unchanged. Each change writes a bounded `assignment_audit` event with reason `full_tower_snapshot_synchronization` and Image source keys. The Android request and response body remain unchanged.

Administrator maintenance scans at most 200 recent Assignments and commits at most 50 explicitly selected active rows. It queries `/image` by exact `assignment_id`, classifies missing, single, duplicate-identical, and duplicate-conflicting sources, never selects a conflicting duplicate, adds only missing values, and audits reason `full_tower_snapshot_backfill`. Historical records remain snapshots. No RTDB path, field, push-key layout, or relationship was renamed.
