# M9R-C Finished failure matrix

All failures return the raw legacy HTTP 500 envelope.

| Boundary | Already committed | Remaining state/retry |
|---|---|---|
| Assignment read | none | unchanged; retry restarts |
| initial user read | Assignment read only | unchanged |
| any Cell query/write | earlier Cell writes | retry repeats earlier Cell closure/upsert |
| image query/write | all Cell work and earlier image writes | retry repeats them |
| Tower query/write | Cells/images and earlier Tower writes | retry repeats them |
| second user query/write | Cells/images/Tower and earlier user writes | retry repeats them |
| Assignment update | all related-record writes | Assignment remains prior state |
| productivity query/transaction | Assignment closed; some concurrent achievement transactions may commit | retry increments committed rows again |
| rigger query/transaction | Assignment closed; productivity work may partially/fully commit | retry can double-count |

There is no rollback. Promise concurrency means the exact subset committed
inside the final achievement fan-out is timing-dependent in a real RTDB
failure. Deterministic tests prove invocation order and representative
post-Assignment failure, but cannot claim a universal network completion order.

