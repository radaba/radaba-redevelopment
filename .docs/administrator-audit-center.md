# Administrator Audit Center

The read-only Audit Center is available at `/home/admin/audit`, with deep-linked detail at `/home/admin/audit/{auditId}`. Both routes resolve the existing active `super_admin` plus strict `/privilege` authorization before constructing the audit read repository. Navigation visibility is cosmetic.

The list accepts URL parameters `q`, `action`, `resourceType`, `administrator`, `dateFrom`, `dateTo`, `sort`, `direction`, `page`, and `pageSize`. Search is server-side, case-insensitive contains matching across display-safe identifiers, action/resource fields, administrator UID/email, summary, and request ID. Snapshot values are deliberately excluded from search. Exact action, resource type, administrator, and inclusive UTC-date filters can be combined. Approved sorts are timestamp, action, resource type, and administrator email; audit ID is the deterministic tie-breaker. Page sizes are 25, 50, and 100.

## Storage and performance

The current implementation performs one server-only read of `administrator_audit`, maps and defensively sanitizes records, then filters, sorts, and paginates in application memory. Only the selected page DTO reaches rendering. This matches current unknown volume without adding indexes or denormalization. Revisit indexed/bounded queries when audit volume makes a full collection read operationally material; RTDB multi-filter limitations may require a separately approved access pattern.

Detail presentation shows safe structured before/after snapshots and a top-level added, removed, changed, or unchanged comparison. Malformed legacy records show available sanitized fields without reconstructing history. Optional IP and user agent fields appear only when stored. No update/delete API or repository method exists, and list/detail reads never call the audit writer or generate recursive audit events.
