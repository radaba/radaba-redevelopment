# M9R-D concurrency review

Services keep no mutable request state, but RTDB operations are not guarded by compare-and-set source-state checks. Concurrent simple transitions are last-write-wins at Assignment. Concurrent Finished calls can both execute their fan-out and both increment achievement transactions.

Transactions protect individual achievement counter increments from loss; they do not make the overall workflow atomic or idempotent.
