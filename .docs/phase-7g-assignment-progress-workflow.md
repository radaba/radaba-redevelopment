# Phase 7G: Assignment Progress Workflow

## Scope

Phase 7G centralizes the confirmed legacy state model and adds three authenticated operational actions: Accept Assignment, Start Work, and Pause Work. Resume and completion were added in Phase 7H; travelling, arrival, waiting, testing, rejection, dropping, and closing writes remain outside this phase.

## Transition matrix

| Current       | Action   | Next          | Timestamp fields                     |
| ------------- | -------- | ------------- | ------------------------------------ |
| `Open`        | `accept` | `Accepted`    | `accepted_date`, `accepted_datetime` |
| `Accepted`    | `start`  | `On Progress` | `checkin_date`, `checkin_datetime`   |
| `On Progress` | `pause`  | `Paused`      | `paused_date`, `paused_datetime`     |

## API and security

`POST /api/assignments/{assignmentId}/transition` accepts only `{ "action": "accept" | "start" | "pause" }`. It uses the existing active-session and exact `/assignment` privilege boundary. Jakarta timestamps and target states are derived on the server.

## Atomicity and compatibility

The Firebase repository performs one transaction on the existing Assignment. It maps the action against the latest `assignment_state`, aborts invalid or stale transitions, and applies the state, existing timestamp fields, and dependent created-date composites together. No new database field or status value is introduced. Existing Revisit and completed-Rigger rules are unchanged.

## UI and timeline

The Assignment Detail page displays only the action valid for the current state in its header and quick-action section. A confirmation dialog explains that the latest state will be verified. After success the server view refreshes, and the existing timeline renders the accepted, work-started, or paused event from the newly stored timestamp.
