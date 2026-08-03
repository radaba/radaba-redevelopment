# Phase M4R foundation

Baseline: branch `feature/login-redesign`, commit
`14744d2c3f1dd7cc7a8107ae9d789a20719f326c`, with a heavily dirty pre-existing
worktree. `scripts/preflight.cmd` passed.

Created compatibility request/response/time/error adapters, RTDB path and
repository contracts, a real `cell` read repository, Auth and authorization
skeletons, fake repositories/Auth, sanitized fixtures, shadow comparison, and
three read-only App Router routes.

Focused validation: 36 tests passed; TypeScript passed. Full project validation
is recorded at closeout.

The project uses existing Firebase Admin initialization. Runtime environment
selection depends on the existing documented environment variables; M4R does
not assert that local credentials identify production, staging, or development.
Tests are environment-independent.

No Assignment write flow, Android change, Firebase write/schema change,
dependency change, lockfile change, deployment, or operational API call was
made.
