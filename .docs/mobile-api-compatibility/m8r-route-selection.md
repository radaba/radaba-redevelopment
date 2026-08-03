# M8R route selection

Selected: `updateImageDetails` (critical risk), the only remaining legacy image
write route. Android declares three PUT callers: full-tower additional data,
justification, and uploaded-image registration. All send identity query values
that legacy ignores and an arbitrary JSON body. Response DTOs are
`AssignmentFullTowerResponse` and `JustificationResponse`.

The route reads `assignment`, optionally upserts derived `cell` rows when
`tower_height` is present, then upserts `image` by `assignment_id`. It performs
no Storage operation. Replay repeats every read/write and concurrent first use
can create duplicates.

Deferred: `getCardCategory` (read/CPU photo-card generator, no write and known
typos), `updateAssignmentDetails` (mixed Assignment lifecycle/image status), and
all byte upload, delete, thumbnail, signed-URL, and Storage behavior because no
legacy route proves them.
