# Technical debt

Critical: three Android-declared routes remain absent; Accept/Check-in/Go/close contracts remain unresolved; Android Bearer authentication evidence is incomplete; live staging/cutover telemetry is unavailable.

High: Finished fan-out remains replay/partial-write sensitive; metrics are process-local; legacy-compatible and observe modes remain; public mobile routes are not uniformly operationally wrapped; legacy fallback flag has no implementation.

Medium: repository began M14R heavily dirty and many phase files are untracked; package and lockfile have pre-existing changes; several `.mjs` modules lack explicit TypeScript declarations; Node warns about module type in tests; one lint warning remains; unused dependency candidates require bundler/runtime evidence.

Removal gates: 30-day zero-use telemetry, consumer-owner approval, replacement contract tests, staging rehearsal, documented rollback, and change approval.