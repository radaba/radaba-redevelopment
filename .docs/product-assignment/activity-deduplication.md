# Activity deduplication

Events normalize in memory only. The deterministic key is event type plus timestamp (second precision) for the target Assignment. Priority is explicit Assignment audit, explicit revisit/evidence/report metadata, then inferred Assignment fields. Equal-priority collisions use canonical source keys. Invalid timestamps sort last with type and event-key tie breakers. Audit Center redaction removes token, credential, password, secret, private-key, byte/base64 and sensitive URL values while preserving zero and false.
