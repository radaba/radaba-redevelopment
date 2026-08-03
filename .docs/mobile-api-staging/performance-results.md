# M12R performance results

Local M12R full test inventory completed 518 tests in about 3.26 seconds. These timings characterize the local harness, not network or Firebase latency.

| Operation | Reads | Writes | Fan-out |
|---|---:|---:|---:|
| Assignment detail | 1 | 0 | 0 |
| Image detail | 1 | 0 | 0 |
| Cell detail | 1 | 0 | 0 |
| AOR summary | 3 sequential | 0 | 0 |
| Simple Assignment transition | 2 | 1 | 1 update |

Finished remains the performance and partial-write hotspot because related records and achievement transactions are sequential. Payloads use existing DTO fixtures; no new fields or binary uploads were introduced. Credible percentile latency and Firebase billing measurements require an approved staging endpoint, sanitized dataset, and observation window.