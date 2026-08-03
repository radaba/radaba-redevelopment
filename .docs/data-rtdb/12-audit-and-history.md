# Audit and history

- `tower_audit/{towerKey}/{auditPushKey}` contains actor/time/action/source and changed-field before/after values. Current Tower create/edit/import writes are atomic with audit through root transactions (`firebase-tower-command-repository.ts:12-17`).
- `administrator_audit/{auditPushKey}` is appended separately and best-effort (`firebase-administrator-audit-repository.ts:5-8`), so the administrative domain mutation and audit are not atomic.
- Assignment revisit history is embedded at `assignment/{key}/revisit_history/{pushKey}` and committed in the Assignment transaction.
- Assignment comments provide operational history but are mutable/deletable, not audit.

No general Cell, image, report, synchronization, archive, or delete audit is proven. Append-only behavior is application convention, not proven by RTDB rules.
