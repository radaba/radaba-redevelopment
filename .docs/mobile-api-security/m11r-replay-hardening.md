# Replay and atomicity review

Read routes and idempotent profile/image metadata replacements are safe or protected by current state checks. Assignment transitions, finish/close, and Cell/Sector fan-out writes remain sensitive to repeated requests and partial failure.

Current Android sends no stable client request ID. Adding server idempotency records would add schema and retention policy; broad Firebase transactions could change legacy partial-failure and retry behavior. Therefore M11R adds authorization before handlers but does not change persistence ordering, atomicity, or replay semantics.

Deferred: introduce an Android-generated request ID, observe duplicate rates, define retention, then use a documented idempotency record or narrowly proven transaction/multi-location update. Until then, existing state-conflict checks are the compatible protection. Observe-mode `replay_suspicion` is reserved for a future reliable signal; it is not inferred from payload guesses.