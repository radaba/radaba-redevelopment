# Production feature flags

| Variable | Default | Allowed | Meaning |
|---|---|---|---|
| MOBILE_COMPATIBILITY_API_ENABLED | true | true/false | Returns a safe 503 from centrally wrapped compatibility routes when false |
| MOBILE_LEGACY_FALLBACK_ENABLED | false | true/false | Governance flag only; no runtime fallback call is implemented |
| MOBILE_MONITORING_ENABLED | true | true/false | Mobile metrics and sanitized request logs |
| PRODUCTION_HEALTH_ENDPOINTS_ENABLED | true | true/false | Health surface availability |
| MOBILE_PROGRESSIVE_ROLLOUT_PERCENTAGE | 0 | 0/5/10/25/50/75/100 | Deterministic cohort target; selection does not switch traffic itself |
| MOBILE_API_SECURITY_MODE | legacy-compatible | legacy-compatible/observe/enforce | Existing M11 security mode; production enforce remains prohibited |

Invalid values fail configuration evaluation. Client input cannot change flags. Secrets do not belong in these flags.