# App Router parity

Both M6R routes export GET, POST, PUT, PATCH, DELETE, OPTIONS, and HEAD through
the same handler to reproduce Pages Router method fallthrough. CONNECT and TRACE
cannot be exported by App Router. Platform HEAD processing may suppress the body.

`URLSearchParams.get` reproduces the first value for repeated query parameters,
empty values, plus decoding, and percent decoding. Neither route reads a body.
JSON envelopes preserve insertion order and content type through the shared
adapter. Undefined fields are omitted by JSON serialization.

The sole material gap is `getUtility` with multiple children. Legacy sends the
first response, then attempts additional responses and can raise a
headers-already-sent error. M6R preserves the first client-observable body and
does not reproduce the post-response failure.
# M8R timing gap

Legacy Cell update callbacks are not awaited. M8R awaits them so App Router can
return one deterministic response; writes remain sequential and non-atomic, so
partial earlier fan-out persists on failure.

## M9R-C Finished

Any-method exports and legacy JSON envelopes are retained. Request.json form-body differences and framework HEAD body suppression remain irreducible. Promise fan-out preserves concurrency but real network completion order is not deterministic.


## M9R-D consolidated parity

Simple transitions are last-write-wins and retain untouched historical fields. Finished is non-atomic and replay increments achievements. These behaviors are locked by characterization tests; no recovery semantics were added.
