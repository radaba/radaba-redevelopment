# Maintenance and testing guide

Run `scripts\validate.cmd` before release. Retain functional, API contract, security, replay/failure, performance-characterization, and integration-style fake-repository tests. Historical tests may be removed only after replacement tests prove the same public DTO, write, failure, and recovery behavior.

Review monthly: dependencies and advisories, health/alert coverage, Firebase rules, privileged access, log redaction, route ownership, technical debt, and backup restore evidence. Review quarterly: unused flags with telemetry, Android endpoint inventory, compatibility mode usage, bundle/build trends, and disaster recovery.

Do not infer dead code from names. Require static references, runtime telemetry, consumer-owner sign-off, a deprecation window, and rollback evidence before deletion.