# Data quality risks

Source-level risks: mixed string/number/boolean/null scalars; null/zero/empty collapse in mobile loops; decimals accepted for sector counts; duplicate `tower_id`, `assignment_id`, `rcell_id`, or email; missing foreign references; stale snapshots; mixed state/status vocabulary; multiple timestamp formats; dynamic image-key variants; Storage/metadata orphans; report URL/object mismatch; malformed coordinates; and composite index drift.

Fixtures prove tolerated shapes and edge handling, not production frequency. No sanitized complete RTDB export was found. **Actual data prevalence is Unknown.**
