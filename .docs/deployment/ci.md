# Continuous integration

ci.yml runs on pull requests and main/develop pushes with read-only repository
permissions and superseded-run cancellation. Independent jobs perform clean npm
installs, environment validation, TypeScript, ESLint, full and mobile contract
tests, Firebase rules checks, secret scanning, npm audit, git diff checks, and a
production build. The build archive is named by commit SHA and is not published
to a registry.

security-scan.yml repeats secret and dependency checks weekly. npm outdated is
informational; dependency changes are reviewed and never auto-applied.

The release runtime is Node 22.14.x with npm 10.x. The previous local Node
20.19.5 runtime does not satisfy one current MapLibre transitive dependency.

Recommended branch protections:

- Feature branches target develop.
- develop requires CI and review before integration/staging.
- main accepts reviewed release or hotfix pull requests only.
- Require quality, contracts, security, and build jobs.
- Require one independent review, resolved conversations, and current branch.
- Disallow force-push and deletion of main/develop.
- Restrict tag creation for vMAJOR.MINOR.PATCH.
- Protect staging and production GitHub environments; production requires a
  release approver who did not author the change.

Fork pull requests receive no environment or deployment secrets and never run
deployment workflows.
