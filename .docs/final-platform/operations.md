# Operations

Monitor throughput, status, latency, 401/403, replay signals, unhandled failures, RTDB operations, security/compatibility modes, health, and deployment identity. In-process counters require an approved durable exporter for multi-instance aggregation. Logs must remain structured and redacted.

Incident response: freeze progression, correlate sanitized request IDs, compare `/live` and `/ready`, check provider status, avoid blind replay of partial writes, and restore the prior artifact/configuration when approved. Backup/restore follows the database guide. Rollback is retained as historical and operational knowledge even though the phase premise says it is no longer required; deleting recovery capability lacks evidence and would add risk.