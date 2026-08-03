# Limitations

- Assignment and User workload cover only the newest 500 records from each root.
- Finished-today uses stored completion/closed dates and the established Asia/Jakarta display date.
- SLA attention is a conservative bounded state indicator, not the full Assignment SLA engine.
- Audit failures and recent events use existing bounded Audit Center sources and the last 24 hours.
- Notification delivery failures and most upload failures are console-only and cannot be counted from application data.
- Report export failures are visible only when their existing audit event was successfully recorded.
- Web health is an in-process readiness evaluation, not an external network probe.
- Mobile health validates route registration, not an authenticated Android round trip.
- Firebase integration checks validate the current configured environment. No environment is mutated.
- No time series, last-success persistence, alerting, trends, or automatic refresh is implemented.
