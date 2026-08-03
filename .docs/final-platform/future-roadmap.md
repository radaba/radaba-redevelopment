# Future roadmap

1. Reconcile the production-status assertion with measured deployment/version and route telemetry.
2. Implement or formally retire missing Android-called routes with consumer approval.
3. Complete Android Bearer/token-refresh and enforce-mode staging evidence.
4. Export metrics/logs to an approved durable backend and establish alert SLOs.
5. Harden replay/atomicity with approved request IDs and schema design.
6. Establish a clean version-control baseline and release tags.
7. After sustained zero-use evidence, deprecate observe/legacy-compatible, fallback and rollout flags, then remove migration-only tests/docs in a separately reviewed change.

No roadmap item is authorized by M14R.