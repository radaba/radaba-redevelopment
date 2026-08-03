# R15C investigation

1. The stable route identifier is the Firebase child key under `tower`.
2. That database key differs from the `tower_id` business/display identifier.
3. Tower and visit fields are stored at the existing `tower` RTDB path.
4. Assignment relates to Tower through exact `assignment.tower_id === tower.tower_id`.
5. Cell relates reliably through `cell.assignment_id`; some mobile records also carry `tower_id`.
6. `tower_id` on Cell is supported when present but is not required by the proven contract.
7. The fallback resolves the newest bounded Assignment for the Tower, queries Cells by its
   `assignment_id`, also queries Cells by `tower_id`, and de-duplicates by Cell database key.
8. Tower images are dynamic `foto_*_name` / `foto_*_url` pairs on the Tower record.
9. Cell images use the same dynamic pairs on each Cell record.
10. Proven timestamps include created, accepted, check-in, submitted/updated variants,
    closed, and completed fields. Only populated values are displayed.
11. Assignment state/status and Cell closed timestamps are authoritative current-state signals.
12. Rigger, coordinator, and RNO name/email fields occur on Assignment, Tower, and Cell records.
13. Tower audit history exists separately at `tower_audit/{towerKey}`; R15C uses recorded
    operational timestamps and does not present them as a complete audit trail.
14. Access reuses Active user plus exact strict `/assignment` privilege.
15. RTDB cannot efficiently join Tower → all Assignments → all Cells or globally paginate
    embedded images. Reads are bounded and no new index or denormalized node is introduced.

The page is a read-only aggregate. It does not persist normalization or validation results.
