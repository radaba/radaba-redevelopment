# Production rollback plan

Rollback uses environment configuration and the deployment platform, never an emergency source edit. Feature rollback disables monitoring or health only when appropriate, keeps compatibility enabled, disables unimplemented legacy fallback, restores rollout to 0, and restores security to legacy-compatible. Deployment rollback selects the last validated immutable artifact. Android endpoint rollback remains a separately controlled Android configuration release.

Order: stop progression; set rollout 0; set legacy-compatible; verify legacy remains available; restore prior artifact if health/error thresholds remain breached; validate `/live`, `/ready`, login, read, and bounded write smoke tests; record incident. No schema rollback is expected because M13 adds none.