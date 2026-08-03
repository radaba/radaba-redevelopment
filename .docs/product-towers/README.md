# R20 Towers Management Enhancement

R20 remains safety-gated for Archive and Delete. The approved incremental runtime milestones R20A Tower Edit, R20B Dependency Viewer, R20C Audit Timeline, and R20D Map & GIS View are implemented. Two lifecycle safety gates remain failed:

1. Tower has no confirmed archive/inactive lifecycle convention; `radaba_status` is an operational visit flag and cannot be reused.
2. Existing bounded reads cannot prove a Tower is truly orphaned across every historical Assignment, Cell, image, and report relationship.

See the linked policies before resuming runtime work.

- [Investigation](r20-investigation.md)
- [Field policy](r20-field-policy.md)
- [Update design](r20-update-design.md)
- [Dependency policy](r20-dependency-policy.md)
- [Archive policy](r20-archive-policy.md)
- [Delete policy](r20-delete-policy.md)
- [Authorization](r20-authorization.md)
- [Audit](r20-audit.md)
- [Test matrix](r20-test-matrix.md)
- [Known limitations](r20-known-limitations.md)

No Tower, Assignment, Cell, image, report, mobile API, Android source, RTDB schema, or production deployment was changed.

- [R20D Map & GIS View](r20d-map-gis.md)

- [R20E Tower CSV export and safe import preview](./r20e-import-export.md)
