# Getting started and deployment guide

Local workflow: install the lockfile with the approved Node/npm versions, provide values named in `.env.example` through local secret handling, run `scripts\preflight.cmd`, then `scripts\validate.cmd`. Never commit environment values or service accounts.

Deployment uses a reviewed immutable artifact. Validate tests, lint, TypeScript, build, route inventory, health behavior, Firebase project configuration, security mode, rollout percentage, monitoring, and rollback artifact. Production changes require external change approval. M14R executes no deployment.

Coding standards: keep routes thin, validate at boundaries, derive identity server-side, preserve Firebase contracts, isolate provider access in repositories, use safe errors, add deterministic fixtures, and update the definitive API/debt records with behavior changes.