# Staging deployment

Staging is triggered by develop or manual dispatch. The reusable CI gate must
pass, then the protected staging environment supplies its own public Firebase
configuration and Admin credential. A commit-addressed standalone archive is
built once, downloaded by the self-hosted staging runner, and passed to the
fixed deployment adapter.

Required runner adapters:

- /opt/radaba/bin/environment-fingerprint
- /opt/radaba/bin/deploy-release

The adapter must lock deployments, retain the prior release, unpack into a new
release directory, start it on an alternate internal port when capacity allows,
wait for health, switch the proxy, and retain bounded logs. The workflow then
runs non-destructive health/login readiness smoke tests.

No staging execution occurred in this milestone because no remote, protected
environment, runner, target URL, or approved staging Firebase project is
configured in the repository.
