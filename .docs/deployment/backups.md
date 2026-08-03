# Backup and restore policy

No repository evidence proves a current RTDB, Storage, configuration, or VPS
backup. A backup is not considered valid until restored into an isolated,
non-production target and verified.

Recommended policy:

- RTDB: daily managed export plus pre-change export for schema/migration,
  privilege backfill, or large mutation releases; retain 35 daily and 12 monthly.
- Storage: object versioning or daily incremental copy to a separate protected
  project/account; retain according to business and privacy policy.
- Configuration: encrypted secret-manager versions and reviewed non-secret
  infrastructure configuration; never archive plaintext secrets with artifacts.
- Audit/logs: retention owned by operations and security, with access logging.
- Encryption: provider-managed at rest plus TLS in transit; restrict restore
  identities separately from application identities.
- Restore test: monthly staging/isolated data restore and quarterly application
  recovery rehearsal.

backup-verification.yml calls an operator-owned adapter with isolated and
no-production-writes requirements. No backup or restore was executed here.
