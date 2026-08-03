# Trusted identity mapping

The bearer token (preferred) or existing `__session` cookie is verified by Firebase Admin with revocation checking. The verified UID and email are matched to exactly one existing `user` profile. No query/body token is accepted.

Trusted attributes are UID, normalized comparison email, existing role/position, and active/account state. Request rigger/coordinator fields are comparison inputs only and cannot grant access. Assignment ownership comes from `rigger_email`; coordinator scope comes from `coordinator_email` or `rno_email`. Cell access is derived from the related Assignment and Cell `rcell`; image access inherits its parent Assignment policy.

Missing or duplicate profiles, inactive/disabled accounts, malformed mappings, and unknown roles are violations. They are observed without blocking outside enforce mode. IDs are validated, never normalized; valid numeric strings and Unicode remain valid while whitespace changes and RTDB metacharacters are rejected.