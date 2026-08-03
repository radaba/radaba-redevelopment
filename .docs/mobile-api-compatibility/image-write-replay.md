# Image write replay

The route is replay-sensitive. Identical requests repeat Assignment and Cell
reads, repeat every Cell upsert, and repeat the image upsert. Existing matches
are update-like, but concurrent read-before-push requests can create duplicate
Cell or image rows. No idempotency marker, retry guard, request ID, URL
deduplication, or generated identifier is returned.
