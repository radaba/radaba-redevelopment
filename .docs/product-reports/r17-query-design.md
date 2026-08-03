# R17 query design

The global list reads at most 201 recent Assignment children ordered by key, normalizes records
that contain either report field, then applies server-side filters and bounded page offsets.
Assignment-scoped lookup uses exact `assignment_id`; Tower-scoped lookup uses exact `tower_id`.
No report index, root scan, or N+1 parent lookup is added. True global closed-date pagination is
not available under the current schema.
