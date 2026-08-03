# R19 Synchronization Design

Synchronization is deferred and no endpoint exists.

A future design must use review tokens made from exact Tower/Assignment network values rather than a new schema version field. On commit it must:

1. resolve an active authorized user server-side;
2. directly read the selected Tower and bounded selected Assignments;
3. verify Tower ID relationship;
4. compare current Tower values to reviewed Tower values;
5. compare current Assignment values to reviewed Assignment values;
6. re-check eligibility and completion evidence;
7. update only approved legacy band fields in per-Assignment transactions;
8. return updated/skipped/conflicted/failed per Assignment;
9. append approved immutable audit evidence;
10. never run automatically after Tower save.

The browser must never choose RTDB paths or submit arbitrary field names.
