# Settings security

The page resolves the existing strict administrator boundary before building its catalog. Ordinary authenticated users receive the standard permission-denied state, and unauthenticated users are redirected to login. Navigation is administrator-only.

No inputs or update endpoint exist. Firebase credentials, API keys, service-account content, database URLs, bucket names, private keys, tokens, and environment values are never returned. Integration cards expose only `Configured` or `Not configured`. Critical protections such as inactive-user denial, final-administrator protection, formula protection, and redaction are explicitly read-only.
