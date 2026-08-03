# Phase 7J: Assignment Checklist and Work Report

## Scope

Phase 7J adds optional structured work execution data without changing Assignment status transitions, completion prerequisites, Photo Evidence, or the lifecycle timeline.

## Data model

Two optional children are stored inside the existing `assignment/{pushKey}` record: `work_checklist` and `work_report`. Keeping the bounded structures on the Assignment allows each save transaction to verify the latest completion state, actor relationship, and section revision atomically.

`work_checklist` contains revision, initialization/update attribution, and keyed items. Each item stores the server-owned label for defaults, the `pending`, `completed`, or `not_applicable` status, optional note, custom flag, and latest updater/time. Eight conservative defaults are rendered virtually for legacy records and are persisted only on first save. Defaults cannot be renamed or deleted; custom UUID items can.

`work_report` contains revision, findings, actions performed, technical result, completion notes, recommendations, structured keyed materials, and latest updater/time. Materials are informational and do not update inventory.

## Authorization and lifecycle

Viewing continues to require strict `/assignment` access. Editing additionally requires the latest persisted Assignment to be active and the trusted session email to match `rigger_email` or `coordinator_email`, or the role to be `super_admin`. Completed Assignments are read-only for everyone. Revisit preserves both structures and restores editing for eligible users.

## API and concurrency

`PUT /api/assignments/{assignmentId}/checklist` and `PUT /api/assignments/{assignmentId}/work-report` validate bounded JSON with Zod. Actor identity and Jakarta timestamps are server-derived. Independent section revisions provide optimistic concurrency; stale saves return HTTP 409 and do not overwrite newer data. Firebase transactions on the existing Assignment repeat state, permission, and revision validation.

## UI

Assignment Detail includes a Work Execution section with independent Checklist and Work Report view/edit modes. Desktop uses two columns and mobile stacks the cards. Both editors provide explicit Save and Cancel, pending guards, nearby accessible errors, and confirmation before deleting custom rows. Completed Assignments show a read-only explanation.

## Limits

- 40 checklist items; label 200 characters; item note 1,000 characters.
- Five report fields, each 5,000 characters.
- 30 materials; name 200, unit 30, note 500 characters.
- Material quantity must be positive and no greater than 1,000,000.

## Compatibility

Legacy records require no migration. Revisit and workflow transactions preserve the optional children through record spreading. Checklist and report data remain optional for completion. No audit node, inventory write, autosave, draft persistence, or timeline event is introduced.