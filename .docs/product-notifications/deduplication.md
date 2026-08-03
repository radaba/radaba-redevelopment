# Deduplication and delivery

The deduplication identity combines operation ID, recipient user key, type and target Firebase key. A reservation is made before feed creation so request and transaction retries do not duplicate delivery. Operational commits precede best-effort notification delivery because existing modules do not share one root transaction boundary. Delivery failure is logged with a sanitized code and never rolls back a successful operational change.
