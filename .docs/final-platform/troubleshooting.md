# Troubleshooting

`/live` failure indicates process/platform failure. `/ready` failure reports only safe blocker codes; verify environment configuration, compatibility policy count, rollout 0, and permitted security mode. A healthy endpoint does not prove business workflow readiness.

For 401, inspect token expiry/revocation and active profile mapping without logging credentials. For 403/404, inspect trusted role and object relationships. For 409, inspect lifecycle state and idempotency rules. For 500, use request/correlation ID and sanitized server logs.

For partial Assignment/Cell/image writes, stop automatic retry and consult M9/M10 failure matrices. For DTO parsing, verify exact route casing, method, envelope, null/scalar behavior, and Android model. For build failures, run TypeScript and lint independently before the full validator.