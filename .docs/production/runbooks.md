# Production runbooks

## Deployment

Validate immutable artifact, verify flags at rollout 0 and legacy-compatible, confirm legacy availability, check health/metrics/log sink, run smoke tests, then seek explicit traffic approval.

## Rollback and incident response

Freeze progression, identify request/correlation IDs, set rollout 0, restore legacy-compatible, compare health/error/latency, and restore the prior artifact if necessary. Preserve sanitized evidence and publish an incident timeline.

## Authentication or security incident

Check 401/403 trends and Firebase Auth health without logging tokens. Disable progression; revoke affected accounts through approved operations; do not relax authorization or enable fallback silently.

## RTDB/Firebase outage

Stop writes and rollout, confirm provider state, avoid automated replay of partial workflows, retain legacy routing, and use M9 recovery matrices.

## Compatibility incident

Compare the exact DTO, route casing, read/write trace, and mode. Restore traffic to legacy through the approved client/routing control. Do not patch production data or remove compatibility APIs.