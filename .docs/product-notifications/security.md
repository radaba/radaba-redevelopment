# Notification security

Every list and mutation resolves the verified session to its authoritative RTDB user push key. APIs accept no recipient key and always operate below that owner path; administrators receive no cross-user bypass. Routes are allowlisted and require real Firebase keys. Messages reject common secret/token patterns and never contain report download URLs or before/after payloads. Read actions are intentionally not audited.
