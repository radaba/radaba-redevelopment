# R19 Audit

Existing `tower_audit/{towerKey}/{auditKey}` records are append-only and atomically committed with Tower create/edit/import. They contain Tower identity, actor, time, action/source, changed fields, and before/after values.

R19 requires reason and per-Assignment results that the current contract does not carry. Do not overload or mutate old audit events. An extension must be approved before runtime synchronization and must remain append-only, token-free, and atomic where practical. No new audit schema was added.
