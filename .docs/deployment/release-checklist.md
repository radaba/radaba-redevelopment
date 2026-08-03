# Release checklist

- [ ] Version is vMAJOR.MINOR.PATCH and release notes are complete.
- [ ] Exact main commit and clean checkout are recorded.
- [ ] CI quality, contracts, security and build jobs passed.
- [ ] Mobile compatibility blockers and limitations are listed.
- [ ] Environment fingerprint matches the approved target.
- [ ] Configuration changes and required secrets are reviewed.
- [ ] Migration is absent, or has version/dry-run/preview/idempotency/audit and approval.
- [ ] Artifact digest and retention location are recorded.
- [ ] Backup requirement is classified and completed where required.
- [ ] Staging health, functional smoke and rollback drill passed.
- [ ] Expected downtime is stated; zero downtime is not claimed without evidence.
- [ ] Monitoring, log retention and incident owners are ready.
- [ ] Production environment approval is recorded.
- [ ] Prior healthy immutable release and rollback command are recorded.
- [ ] Post-deploy smoke plan is non-destructive.

Release notes must include version, commit, date, features, fixes, migrations,
configuration changes, limitations, rollback notes and Android/mobile impact.
