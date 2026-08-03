# Known unknowns

- Complete production top-level path inventory and deployed RTDB rules/indexes.
- Actual prevalence of duplicates, mixed types, null/absence, decimals, orphans, and stale composites.
- Whether all production mobile traffic reaches App Router or legacy endpoints.
- Backend/runtime writers outside both inspected repositories.
- Firebase Storage object/metadata consistency and retention.
- Cell/image concurrency behavior under real multi-device load.
- Historical audit completeness and retention.
- Complete Tower dependency enumeration and safe deletion proof.
- Operational maximum/validation for radio sector counts.
- Production authorization/rules behavior.

These require sanitized exports, emulator/staging fixtures, backend confirmation, and Android device validation—not production access during this investigation.
