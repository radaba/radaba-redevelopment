# Rollout plan

No stage is executed by M11R.

0. Run local tests in `legacy-compatible`.
1. Enable staging `observe`; review sanitized reason counts and false positives.
2. After Android bearer-token readiness, enforce selected staging reads.
3. Enforce low-risk staging writes and validate ownership/relationship decisions.
4. Complete Android staging validation, token refresh, 401/403 UX, logout, and retry tests.
5. Run production `observe` after operational approval and monitoring ownership.
6. Enable selected production enforcement only after a code/config change that removes the M11R production guard and receives explicit approval.
7. Enable full enforcement only after evidence review and explicit approval.

Rollback is configuration-only in non-production: restore `MOBILE_API_SECURITY_MODE=legacy-compatible` and redeploy the previously approved artifact. Production cannot enter enforce with this code. Do not roll back token-free login logs or reintroduce sensitive logging.