# R15C query design

The query performs one direct `tower/{key}` read, one bounded exact `tower_id` Assignment
query, and at most two bounded Cell queries: exact `tower_id` and the newest Assignment's
`assignment_id`. Results are de-duplicated by Cell database key before image normalization.
The strategy avoids root scans and per-Cell parent reads.

The current schema cannot prove that every historical Cell is reachable without querying
every Assignment. The workspace intentionally presents a bounded operational cohort and
reports the limitation rather than adding an index node.
