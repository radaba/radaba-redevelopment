# Production deployment

Production accepts a semantic version tag whose commit is on main, or an
authorized manual main run. The production GitHub environment is the mandatory
manual approval boundary.

After approval the workflow:

1. Builds one environment-specific immutable archive.
2. Verifies the target environment fingerprint.
3. Requires an approved backup adapter.
4. Records a pre-deploy backup.
5. Passes the exact commit, tag, and archive to the deployment adapter.
6. Runs non-destructive post-deploy smoke tests.

Required production adapters additionally include
/opt/radaba/bin/backup-release. Their implementation, Nginx switch mechanism,
registry, VPS paths, log sink, retention and credentials must be reviewed on the
actual server before enabling the workflow.

Do not deploy from an arbitrary workstation or moving branch. Do not enable
mobile enforcement or rollout while its existing blockers remain.
