# Administrator Audit Infrastructure

Administrator audit records are stored in a dedicated append-only RTDB collection:

```text
administrator_audit/{generatedAuditId}
```

The Firebase repository obtains a new push reference, uses its key as `auditId`, and sets the record once. The interface exposes only `append`; it exposes no update or delete operation.

Each record stores an ISO server timestamp, administrator UID and email, action, resource type and identifier, summary, safe before/after snapshots, request identifier, and optional proxy-provided IP address and user agent. Snapshot sanitization recursively removes keys associated with passwords, tokens, cookies, sessions, secrets, credentials, private keys, authorization, and custom claims. Inputs are bounded before persistence.

Initial integrations are `user.role.changed` and `user.status.changed`. Their snapshots contain only the changed role or status. Privilege, News, Gallery, Touring, Assignment, authentication, and other workflows are not integrated.

## Failure policy

The established administrative write is authoritative and completes first. Audit persistence is a separate best-effort append because a cross-branch transaction would widen and change the existing write boundary. Audit failure returns no business error and never rolls back or corrupts the completed change. It emits a sanitized internal error containing only action, resource type/identifier, and request identifier; raw errors and snapshots are not logged.

Future administrator commands reuse `recordAdministratorAudit(repository, input)` and provide a resource-specific safe snapshot rather than implementing their own storage logic.

The read-only inspection surface is documented in `.docs/administrator-audit-center.md`. It uses a separate repository exposing only `list` and `find`; viewing, searching, filtering, and paging never append audit records.
