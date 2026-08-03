# Production progressive rollout

Supported percentages are exactly 0, 5, 10, 25, 50, 75, and 100. SHA-256 hashes a versioned salt plus a stable non-secret key and maps the first 32 bits to bucket 0–99. A subject is selected when its bucket is below the percentage, providing stable monotonic cohorts.

The selector is a prepared decision primitive only; M13 does not route traffic or call legacy. Progression requires explicit approval at every step, staging-derived error/latency/auth thresholds, minimum observation windows, and a rollback owner. Any threshold breach returns the percentage to 0 and security to legacy-compatible. Never use raw tokens, passwords, or emails as cohort keys.