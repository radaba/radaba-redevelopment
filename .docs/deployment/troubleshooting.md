# Troubleshooting

Environment validation failure: compare variable names with .env.example and
use only the safe fingerprint in tickets. Never paste environment values.

Build failure: reproduce from a clean checkout with the pinned Node/npm versions
and npm ci. Remove generated .next/cache only when diagnosing stale output.

Readiness failure: inspect the public blocker codes, then sanitized structured
logs by request/build ID. Do not paste tokens, Firebase URLs, user records or raw
provider errors.

Unhealthy deployment: do not switch traffic. Retain the failed release logs,
keep the previous release serving, and investigate. If traffic already switched,
follow rollback.md.

Firebase rules check: this repository currently owns Storage rules only. An
absent RTDB/Firestore rules file is a production-readiness gap, not permission
to create or deploy partial rules.

502/503: verify application health on its internal port, proxy upstream,
forwarded headers, timeout and request-size settings. Actual Nginx configuration
was not available in this repository and must be audited on the target VPS.
