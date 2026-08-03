# Phase 7F: Revisit Assignment

## Scope

Phase 7F allows an authorized user to reopen an existing completed Assignment for additional work. It does not duplicate the record or change the permission model.

## API

`POST /api/assignments/{assignmentId}/revisit`

Request:

```json
{ "reason": "Incorrect installation. Need additional work." }
```

The reason is trimmed, required, and limited to 2,000 characters. A non-completed record returns HTTP 409 with code `ASSIGNMENT_NOT_COMPLETED`.

## Workflow and persistence

The atomic transaction changes `assignment_state` from the completed representation to `On Progress`, changes `assignment_status` to `Open`, and sets `completed` to `false`. The Assignment push key, `assignment_id`, historical completion/closed timestamps, rigger, coordinator, category, description, and other existing data remain in place.

Each successful revisit increments `revisit_count`, updates `last_revisit_at`, `last_revisit_by`, and `last_revisit_reason`, and appends the approved event payload under `revisit_history/{eventPushKey}`. Existing dependent composite fields are rebuilt to reflect the active workflow values.

## UI

The Assignment detail header and quick-action section expose Revisit Assignment only for completed records. The confirmation dialog requires a reason. Revisit count, latest revisit metadata, chronological timeline events, and a newest-first activity log are derived from the record-local metadata.

## Verification

Automated coverage checks workflow mutation, ID/timestamp preservation, repeat count/history behavior, server and transactional status enforcement, authorization ordering, reason validation, and detail UI integration. Production-shaped manual Firebase and browser verification remains required before rollout.
