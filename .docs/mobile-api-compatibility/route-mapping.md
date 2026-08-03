# Route mapping

| Legacy path | App Router path | Android evidence | Data |
|---|---|---|---|
| `/api/mobile/getRejectDropReasonList` | `src/app/api/mobile/getRejectDropReasonList/route.ts` | No current Retrofit declaration | Static 16-string array |
| `/api/mobile/getCurrentTime` | `src/app/api/mobile/getCurrentTime/route.ts` | No current Retrofit declaration | Jakarta clock |
| `/api/mobile/getCellDetails` | `src/app/api/mobile/getCellDetails/route.ts` | `ApiService.getCellData`, `BaseListResponse<CellDataResponse>` | `cell`, query `assignment_id` |
| `/api/mobile/getassignmentsById` | `src/app/api/mobile/getassignmentsById/route.ts` | `getAssignmentById` | `assignment`, query `assignment_id` |
| `/api/mobile/getImageDetails` | `src/app/api/mobile/getImageDetails/route.ts` | `getFullTowerData` | `image`, query `assignment_id` |
| `/api/mobile/getAorSummaryById` | `src/app/api/mobile/getAorSummaryById/route.ts` | `getAorSummaryById` | assignment/cell/image composite |
| `/api/mobile/getCellDetailsPerSector` | `src/app/api/mobile/getCellDetailsPerSector/route.ts` | No current declaration; `CellDataResponse` shape | `cell`, query `rcell_id` |
| `/api/mobile/getUtility` | `src/app/api/mobile/getUtility/route.ts` | `ApiService.getUtility`, `BaseListResponse<UtilityResponse>` | `utility`, ordered by key |
| `/api/mobile/signin` | `src/app/api/mobile/signin/route.ts` | POST login, `LoginResponse` | Auth; user/privilege reads; log push |
| `/api/mobile/signout` | `src/app/api/mobile/signout/route.ts` | No current caller | Preserved broken ReferenceErrors |
| `/api/mobile/resetPassword` | `src/app/api/mobile/resetPassword/route.ts` | POST reset, string DTO | Firebase Auth reset action |
| `/api/mobile/updateUserDetails` | `src/app/api/mobile/updateUserDetails/route.ts` | PUT profile, `ImageProfileResponse` | user read/update |
| `/api/mobile/updateImageDetails` | `src/app/api/mobile/updateImageDetails/route.ts` | Three Android PUT callers | assignment read; cell/image upsert |

Each route preserves `{code,message,data}`, casing, HTTP status, empty behavior,
and legacy method fallthrough. `getCellDetails` preserves raw Firebase error
messages and unauthenticated access.

Deferred: the remaining 12 routes, including all authentication and write
workflows, two complex Assignment queues, `getCardCategory`, and `getCatalogs`.

## M9R-B

| Legacy path | App Router path | Android evidence | Data |
|---|---|---|---|
| /api/mobile/updateAssignmentDetails | src/app/api/mobile/updateAssignmentDetails/route.ts | PUT updateAssignment; AssignmentUpdateStateResponse | Assignment/user reads and one Assignment update; M9R-B states only |

All other branches return 400 before Firebase access and remain deferred.


## M9R-C

updateAssignmentDetails now also supports the Android Finished request with Cell/image/Tower/user/Assignment/achievement fan-out. updateAssignmentToClosedByID remains deferred for missing current Android contract evidence.


## M9R-D lifecycle disposition

The master route matrix records four exact simple states, Finished with a documented platform limit, and five deferred legacy branches. The executable parity matrix is covered by the consolidation test.

## M10R

| Legacy path | App Router path | Android evidence | Data |
|---|---|---|---|
| /api/mobile/updateCellDetails | src/app/api/mobile/updateCellDetails/route.ts | PUT updateCellDetails; AssignmentCellResponse | Cell equality read by body rcell_id; update all matches or push |

No independent createCell, updateSector, PCI, azimuth, antenna, or tilt route is proven.

## M11R route policy

All 15 mobile routes have an explicit policy in ../mobile-api-security/m11r-route-security-matrix.md. Paths and casing are unchanged; five are public and ten have authenticated or relationship-aware handling (including optional authenticated signout).
