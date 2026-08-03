# M9R-D invariant analysis

Observed invariants:

- Assignment lookup is by legacy `assignment_id`; the first matched record is used.
- Composite indexes preserve legacy spelling, separators, status, tower, date, and sequence values.
- Simple transitions mutate only Assignment.
- Finished preserves the ordered six-node surface and transaction-based achievement increments.
- Missing Assignment returns HTTP 200 with the legacy message.

Non-invariants: legal source state, idempotency, atomic cross-node completion, field cleanup, and request-level concurrency ordering.
