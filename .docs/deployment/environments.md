# Environments

| Environment | Purpose | Required isolation |
| --- | --- | --- |
| local | Developer workstation | Local or explicitly non-production Firebase |
| development | Shared integration and CI | Dedicated development Firebase and URL |
| staging | Release rehearsal | Dedicated staging Firebase, Storage, Auth and URL |
| production | Approved live release | Production Firebase and protected URL |

RADABA_ENV, APP_URL, APP_VERSION, BUILD_ID, browser Firebase values, and
FIREBASE_ADMIN_PROJECT_ID are required. Staging and production also require an
Admin credential source supplied at runtime/build through protected secrets.

The environment contract rejects Admin/client project mismatches, invalid URLs,
production-looking Firebase identities in local/development, malformed split
private keys, and production with a non-production NODE_ENV. Diagnostics expose
only a SHA-256-derived 12-character environment fingerprint.

Environment variables:

| Variable family | Classification |
| --- | --- |
| NEXT_PUBLIC_FIREBASE_* | required, browser-safe identifier/configuration, environment-specific |
| RADABA_ENV, APP_URL, APP_VERSION, BUILD_ID | required, browser/server release identity, environment-specific |
| FIREBASE_ADMIN_PROJECT_ID | required server-only identifier, environment-specific |
| FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY | optional pair, server-only secret credential source |
| FIREBASE_SERVICE_ACCOUNT | optional alternative, server-only secret |
| GOOGLE_APPLICATION_CREDENTIALS | optional alternative, server-only secret path |
| MOBILE_* and PRODUCTION_HEALTH_ENDPOINTS_ENABLED | optional deployment-managed controls |
| RADABA_RUNTIME_DEBUG | optional, local development only |
| NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID | optional public identifier |

No environment may silently inherit a production Firebase identity.
