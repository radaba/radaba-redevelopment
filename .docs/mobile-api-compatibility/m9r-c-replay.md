# M9R-C Finished replay

Classification: replay-sensitive and counter-incrementing.

Every replay regenerates Jakarta closure timestamps, repeats Cell/image/Tower/
user/Assignment updates, then locates the same achievement logical indexes.
Achievement transactions increment `total` and the dynamic category counter
again. The rigger set remains a set, so `total_rigger` does not necessarily
increase; productivity can therefore increase.

Existing productivity/rigger logical rows are reused by index. Missing rows use
new push keys. A retry after a pre-Assignment partial failure repeats earlier
writes. A retry after Assignment closure but achievement failure increments any
achievement transactions that already committed. There is no marker,
idempotency key, duplicate history, compensation, or automatic recovery in this
Finished branch.

This differs from the deferred close-by-ID route, which has a metrics marker.

