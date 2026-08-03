# Rollback

Application rollback switches traffic to the immediately previous healthy,
commit-addressed release. The release ledger must contain version, full commit,
artifact digest, deployment time, health result, and configuration fingerprint.
scripts/release-state.mjs rejects missing, unhealthy, or mutable candidates.

Procedure:

1. Freeze new deployments and name the rollback approver/operator.
2. Confirm the incident is application/configuration related.
3. Select the previous healthy immutable release.
4. Confirm its environment fingerprint and secrets remain valid.
5. Use the operator-owned rollback adapter to switch the proxy/container.
6. Check /api/health, /live, /ready, login and non-destructive reads.
7. Record the incident, exact release change, duration and follow-up.

Never automatically restore RTDB or Storage during application rollback.
Forward-fix is safer after user data has changed, after a non-reversible
migration, or when the prior binary is incompatible with current data.

Target recovery time is infrastructure-dependent and remains unproven until the
staging drill. Production rollback is not authorized before that drill.
