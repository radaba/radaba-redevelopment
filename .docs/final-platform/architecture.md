# System architecture and dependency classification

Browser and Android clients call Next.js App Router routes. Web routes resolve Firebase session cookies and domain privileges; `/api/mobile/*` retains Android DTO envelopes and passes through token/profile/object policy plus operational instrumentation. Services own rules; repositories alone access Firebase Admin RTDB/Auth/Storage. `/live`, `/ready`, and `/health` expose non-sensitive operational state.

Dependency graph: routes -> session/security boundary -> domain/mobile service -> typed repository -> existing Firebase nodes. Cross-cutting paths are operational config -> health/runtime, and request wrapper -> safe logging/metrics.

| Component | Classification | Evidence |
|---|---|---|
| 15 mobile routes and legacy envelopes | KEEP | Current Android/API production contract |
| Mobile security verifier/policy/wrapper | KEEP | Authentication, ownership, error safety, logging |
| Compatibility request/response/timestamp helpers | KEEP | Imported by current handlers and golden tests |
| Replay/failure fixtures and parity tests | KEEP | Only executable recovery/DTO evidence |
| Health, metrics, logging | KEEP | Current operational surface |
| Rollout selector and rollback flags | KEEP (future use) | Inert at defaults; operational safety primitive |
| Legacy fallback flag | DEPRECATE | No fallback network implementation; remains false |
| M4R-M13R phase documents | ARCHIVE in place | Historical evidence and recovery rationale |
| Missing Android routes/contracts | KEEP as technical debt | Cannot fabricate or remove caller expectations |

No component is classified REMOVE: usage telemetry, consumer sign-off, and an approved removal window are absent.