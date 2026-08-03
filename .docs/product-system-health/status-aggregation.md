# Status aggregation

Critical checks are Authentication, Realtime Database, Storage, Web Application, and Mobile API.

- `Unavailable`: any critical check is unavailable.
- `Degraded`: a critical check is not healthy, any supporting check is degraded/unavailable, or a recent bounded critical audit failure exists.
- `Healthy`: all five critical checks are healthy, supporting checks have no degradation, and no recent critical audit failure exists.
- `Unknown`: critical coverage is incomplete or no checks exist.

The page loading is never sufficient to claim health.
