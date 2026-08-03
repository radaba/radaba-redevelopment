# Production deployment readiness checklist

- [ ] Approve release owner, incident commander, monitoring owner, and rollback operator.
- [ ] Resolve every M12 production blocker and obtain staging sign-off.
- [ ] Supply approved Firebase project, RTDB, Storage, Auth/Admin credential configuration through the platform secret manager.
- [ ] Verify RTDB and Storage rules separately; do not migrate schema or data.
- [ ] Run full validation and immutable artifact build.
- [ ] Confirm `/live` is 200 and `/ready` is 200 in the target environment.
- [ ] Keep `MOBILE_API_SECURITY_MODE=legacy-compatible` and rollout percentage 0 initially.
- [ ] Verify structured logs, metrics ingestion, alerts, retention, and redaction.
- [ ] Record current deployment identifier and tested rollback artifact.
- [ ] Rehearse rollback in staging before any production approval.

This checklist is preparatory and authorizes no deployment.