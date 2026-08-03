# System Health

`/home/admin/system-health` is a strict-administrator workspace for live read-only service checks, bounded operational workload, bounded Audit Center warnings, and safe runtime/build metadata. `GET /api/admin/system-health` provides the same private uncached snapshot after independently enforcing administrator access.

It is not continuous monitoring, a public status page, or an external observability platform. It stores no health history and sends no alerts.
