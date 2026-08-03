# R20 Audit

Existing `tower_audit/{towerKey}/{auditKey}` is append-only and atomic with Tower writes. Existing classifications do not cover archive/delete, reasons, dependency results, or confirmation methods.

Before runtime R20, extend the audited contract explicitly with immutable classifications and bounded safe fields. A delete audit must survive removal of `tower/{towerKey}` and contain a limited non-sensitive snapshot, reason, actor, time, exact confirmation method, and complete dependency-check result. Tokens, credentials, cookies, private URLs, and Storage URLs must not be recorded.

No audit contract was changed in this investigation.
