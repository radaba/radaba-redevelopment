# Audit sources

| Root | Shape | Coverage |
|---|---|---|
| `administrator_audit/{auditId}` | Camel-case administrator identity, action, resource type/key, summary, ISO timestamp, request context, before/after | User, role, privilege, profile, invitation, identity repair, sessions, admin maintenance already written centrally |
| `assignment_audit/{assignmentKey}/{auditId}` | Snake-case assignment/entity IDs, actor, source, reason, occurred_at, changed_fields, before/after | Assignment mutations and synchronization |
| `tower_audit/{towerKey}/{auditId}` | Snake-case entity_key/tower_id, actor, source, occurred_at, changed_fields, before/after, optional assignment_sync | Tower create/edit/import |

Push IDs are not treated as globally unique. Canonical identity combines root, parent key, and event key. No other root is presented as an audit source.