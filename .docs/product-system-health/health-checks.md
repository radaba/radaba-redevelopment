# Health checks

Checks run concurrently with a four-second timeout and use `Promise.allSettled` for workload and history sources.

| Service | Check | Scope |
|---|---|---|
| Authentication | Admin SDK `listUsers(1)` | At most one identity; no identity returned |
| Realtime Database | `user` key-ordered read | At most one record |
| Storage | Default bucket metadata | No object transfer or mutation |
| Web | Existing in-process readiness contract | No external HTTP round trip |
| Mobile API | Compatibility policy registry | No client request or mutation |
| Notifications | Notification root key-ordered read | At most one user branch |
| Reports | Assignment-backed source read | At most one record; no report generation |
| Audit | Existing Audit Center repository | Existing bounded multi-source limits |

Each result includes status, check time, duration, safe scope, error classification, limitations, and suggested action. Raw exceptions and stacks are never returned.
