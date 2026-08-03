# Assignment model

Assignments are `assignment/{assignmentPushKey}` with child `assignment_id` and `tower_id`. Web creation resolves the Tower and users, builds a new push-key record, and copies approved Tower fields as a creation-time snapshot (`firebase-assignment-command-repository.ts:54-118`; `assignment-command-service.ts`).

Copied data includes Tower identity/site/location/region fields and the legacy radio configuration. Assignment-specific data includes RNO/rigger/coordinator, category, plan/creation fields, state/status, composite indexes, pause/check-in/close/completion evidence, `image_total`, `image_status`, `report_name`, `report_url`, revisit history, checklist, and work report.

Creation writers are web single-create and import. Mobile actions patch existing records; Android does not create the Assignment. No automatic Tower-to-active-Assignment synchronization exists.
