# Dependency index assessment

A reliable Tower dependency index is recommended only after schema approval and backfill validation. Key it by Tower push key while retaining `tower_id`; store ID membership or independently reconcilable counts, not only mutable counters. Authoritative events must cover Assignment create/revisit/state changes, Cell/image writes, report finish/replacement, imports, and legacy writers.

Required design: idempotent event updates, transactional membership changes, reconciliation from a complete sanitized export, drift metrics, revision/reconciled timestamp, audit, legacy/indirect relationship handling, and delete compare-and-set. Until backfill and reconciliation prove completeness, `can_delete` must never be authoritative.
