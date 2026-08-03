# M9R-D replay matrix

| Operation | Duplicate effect | Safe to retry blindly |
|---|---|---|
| Paused | Rewrites pause time and sequence index | No |
| Rejected | Rewrites close time and sequence index | No |
| Dropped | Rewrites close/site times and sequence index | No |
| On Progress | Rewrites sequence index | No |
| Finished | Repeats fan-out and increments achievement totals again | No |

The endpoint has no idempotency key or replay marker. HTTP failure does not identify the final successful write.
