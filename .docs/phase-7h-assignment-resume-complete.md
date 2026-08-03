# Phase 7H: Resume Work and Complete Assignment

## Scope

Phase 7H extends the bounded Assignment workflow with `resume` and `complete`. Reject, Drop, Close, Travelling, Arrival, Waiting, and Testing remain deferred.

## Resume Work

`Paused` → `On Progress`. The transaction updates the existing state composites but preserves `checkin_date`, `checkin_datetime`, `paused_date`, and `paused_datetime`. Because the confirmed schema has no Resume timestamp, the timeline does not display a fabricated Work Resumed event.

## Complete Assignment

`On Progress` → `Finished`, with `assignment_status=Completed` and `completed=true`. The server writes `completed_date` and `completed_datetime` using Jakarta time, persists the authenticated actor in optional `completed_by_uid` and `completed_by_name`, and rebuilds the existing created-date and Rigger-email/status composites. It does not create closed timestamps or closed composites.

There are no confirmed photo, note, evidence, checklist, report, FTP, ownership, or coordinator prerequisites. None are introduced.

## API, authorization, and concurrency

`POST /api/assignments/{assignmentId}/transition` accepts the bounded actions `accept`, `start`, `resume`, `complete`, and `pause`. The existing active-session and strict `/assignment` privilege boundary applies. One RTDB transaction validates the latest state and commits all fields together; stale, repeated, or concurrent invalid actions return HTTP 409 `ASSIGNMENT_INVALID_TRANSITION`.

## UI and integration

Paused Assignments show Resume Work as the primary action. On Progress Assignments show Complete Assignment as primary and Pause Work as secondary. Dialogs show Assignment ID, Tower ID when available, current state, and target state. Completion naturally activates the completed-Rigger lock. Revisit continues reopening the same record and preserving completion evidence. The timeline uses `completed_by_name` when available and deduplicates completion evidence by type and timestamp.
