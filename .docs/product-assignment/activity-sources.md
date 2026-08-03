# Activity sources

- `assignment_audit/{assignmentKey}/{auditId}`: explicit audits; `action`, `occurred_at`, actor fields, reason, changed fields, before/after and source metadata.
- `assignment/{assignmentKey}`: current legacy timestamps and `revisit_history/{eventKey}`; lifecycle fields are inferred and labeled.
- `cell` queried by exact `assignment_id`: submitted/created/closed timestamps and rigger, sector, band and rcell ID.
- `image` queried by exact `assignment_id`: legacy image timestamps and actor.
- `assignment_photo/{assignmentKey}/{photoId}`: evidence upload timestamps, actor, category and caption.
- Reports remain fields on `assignment/{assignmentKey}`; generation time uses a proven report/work completion timestamp only.

Reads are parallel and capped at 100 per source. Mobile transition APIs store current Assignment timestamps rather than a separate transition log. Legacy records can therefore have incomplete actor and pause/resume history.
