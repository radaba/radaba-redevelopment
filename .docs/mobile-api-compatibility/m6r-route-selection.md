# M6R route selection

## Selected

| Route | Method | Android caller | DTO | Reads | Writes | Risk | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `getCellDetailsPerSector` | Any | No current Retrofit declaration | Response is compatible with `CellDataResponse` | `cell`, exact `rcell_id` | None | Medium | Only remaining bounded Cell/sector read; legacy characterization fixtures exist. |
| `getUtility` | Any; Android GET | `ApiService.getUtility()` | `BaseListResponse<UtilityResponse>` | `utility`, `orderByKey` | None | Medium | Android-proven support data with one simple read. |

Only two routes were selected. A third route could not be added without importing
uncertain deployment state or materially larger behavior.

## Deferred inventory

| Route | Classification | Reads | Writes/side effects | Android | Decision |
| --- | --- | --- | --- | --- | --- |
| `getassignmentsActiveUploadFinish` | Assignment read | assignment | none | Proven | Defer: date defaults, three queues, paginate-before-sort. |
| `getassignmentsActiveUploadFinishById` | Assignment read | assignment | none | Proven | Defer: required-in-practice inputs and pagination behavior. |
| `getCardCategory` | utility/support | none | CPU expansion | Unproven | Defer: caller-controlled expansion, typo-heavy large contract. |
| `getCatalogs` | reference read | category/fallback paths | none | Proven | Defer: untracked legacy source, uncertain deployment, parallel multi-path fallbacks and locale sorting. |
| `resetPassword` | authentication | Auth | password-reset action | Proven | Excluded write/side effect. |
| `signin` | authentication | Auth/user/privilege | log | Proven | Excluded. |
| `signout` | authentication | Auth/session | Auth/user | Unproven | Excluded. |
| `updateAssignmentDetails` | Assignment write | many | many | Proven | Excluded. |
| `updateAssignmentToClosedByID` | mixed lifecycle | many | fan-out/metrics | Unproven | Excluded. |
| `updateCellDetails` | Cell write | cell | cell upsert | Proven | Excluded. |
| `updateImageDetails` | image write | assignment/image/cell | image/cell | Proven | Excluded. |
| `updateUserDetails` | profile write | user | user | Proven | Excluded. |

Already implemented before M6R: `getRejectDropReasonList`, `getCurrentTime`,
`getCellDetails`, `getassignmentsById`, `getImageDetails`, and
`getAorSummaryById`.

Uncertainties: no current Android caller for the per-sector route; `getUtility`
can attempt multiple legacy responses when more than one child exists; deployed
status of the untracked `getCatalogs` source is unknown.
