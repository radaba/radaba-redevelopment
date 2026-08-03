# R15C data model

`TowerWorkspaceRecord` is server-only and contains the raw `TowerVisitRecord`, a bounded
Assignment summary, distinct `CellRecord` objects, sector groups, R15A normalized Tower and
Cell images, correlated operational people, recorded timestamp events, and warnings.

Cell database keys remain route identities. `rcell_id` remains the business/display identity.
No aggregate, warning, group, or normalized image is persisted.
