# Radaba delivery and release operations

This directory defines the repository-side release contract. Production was not
deployed while creating it.

The supported artifact is the Next.js standalone bundle produced by npm run
build. Dockerfile packages the same bundle as a non-root container. CI retains
commit-addressed archives; staging and production rebuild once with their
approved public Firebase configuration because NEXT_PUBLIC values are embedded
at build time.

Deployment workflows call fixed, operator-owned adapters under
/opt/radaba/bin on protected self-hosted runners. Those adapters and runners are
infrastructure prerequisites; the repository does not guess VPS, Nginx, backup,
registry, or credential details.

Start with environments.md and ci.md. Use release-checklist.md for a release,
production.md for approval, and rollback.md only after a staging drill.
