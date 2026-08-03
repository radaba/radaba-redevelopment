# Phase M10R: Cell and sector write compatibility

M10R implements one proven route: `/api/mobile/updateCellDetails`. Android
declares it as PUT with identity/audit query values, an arbitrary `JsonObject`
body, and `BaseResponse<AssignmentCellResponse>`. The legacy route ignores all
query values and uses `body.rcell_id`.

There is no separate Sector RTDB node or Sector write API. A sector is a Cell
record identified by `rcell_id`, with `sector` and `band` stored as fields.
Therefore Cell creation and Sector update are the same legacy upsert contract.

## Route inventory and selection

| Candidate | Method | Purpose/caller/DTO | RTDB | Replay/fan-out | Decision |
|---|---|---|---|---|---|
| `updateCellDetails` | Any; Android PUT | Main/report dialogs update Cell parameters; `JsonObject` to `AssignmentCellResponse` | Read `cell` by `rcell_id`; update every match or push | Repeats update; concurrent missing reads can duplicate; duplicate rows fan out | Selected |
| `updateImageDetails` Cell fan-out | Any; Android PUT | Tower-height metadata; `AssignmentFullTowerResponse` | Cell plus image | Multi-Cell fan-out | Already implemented in M8R |
| `updateAssignmentDetails` Finished Cell fan-out | Any; Android PUT | Close sectors | Six-node workflow | High | Already implemented in M9R-C |
| `updateAssignmentToClosedByID` Cell fan-out | POST/PUT | Close-by-ID | Multi-node | Critical | Deferred with M9R-C evidence gap |
| `createCell`, `saveCell`, `updateSector`, `saveSector`, `updatePCI`, `updateAzimuth`, `updateAntenna`, `updateTilt` | None | No independent legacy route, Retrofit caller, request model, or response DTO | Unproven | Unproven | Not implemented |

## Exact contract

The body is copied unchanged. When present, these fields are mirrored:

| Input | Additional stored/returned field |
|---|---|
| `mechanical_tilt_before` | `mechanical_tilt_after` |
| `electrical_tilt_before` | `electrical_tilt_after` |
| `azimuth_before` | `azimuth_after` |
| `antenna_height` | `antenna_height_after` |

Zero, empty string, null, false, numeric strings, and unknown fields remain
pass-through values. No field allowlist, identifier validation, timestamp,
ownership check, state check, or schema addition exists.

Data flow:

1. Parse the JSON body.
2. Apply the four legacy mirror rules.
3. Query `cell.orderByChild("rcell_id").equalTo(body.rcell_id)`.
4. Sequentially update every matching `cell/<key>`, or push the body under
   `cell` when no match exists.
5. Return HTTP 200 `{code:200,message:"success",data:<mirrored body>}`.
6. Parse/read/write errors return HTTP 500 with the raw error message.

## Android coverage

`ReportCellUtil.getCellBody` supplies Assignment and site context. Main,
MainReview, and AfterReview ViewModels add `rcell_id`, `band`, `sector`, and
parameter-specific values. Proven parameter groups include generic property
updates, antenna ports, antenna type/serial, and RRU type/serial.
`AssignmentCellResponse` consumes ten fields; Gson ignores the other returned
context fields. Retrofit's `rcell_id` query argument is actually populated with
an Assignment ID by the repository method, but legacy ignores it.

## Replay and failure behavior

Identical replays repeat the equality read and every matched update. No time
field changes because the route creates no timestamps. Sequential retry after a
successful create finds and updates that row. Concurrent first-use requests can
both observe no match and create duplicate rows.

A read failure writes nothing. A create failure leaves no completed row. With
duplicate matches, an update failure leaves earlier successful child updates
and skips later children. There is no rollback or compensation.

Legacy callbacks could return success before an unobserved push failure and
could attempt multiple responses for duplicate updates. App Router awaits each
write and returns one deterministic success or raw-message failure. This is the
same conservative timing gap already accepted for M8R.

## Security and rollback

The route intentionally remains unauthenticated and ownership-free, accepts
arbitrary fields, exposes raw errors, and permits cross-assignment Cell IDOR.
It touches only the existing `cell` node; Auth, Storage, Assignment, image,
Tower, user, log, metrics, and achievement nodes are excluded.

Rollback removes the `updateCellDetails` route, Cell command repository,
service, handler, fixture, test, and this M10R documentation. No data, schema,
dependency, Android, or lockfile rollback is required.
