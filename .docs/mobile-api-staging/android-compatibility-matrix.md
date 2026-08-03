# M12R Android compatibility matrix

| Android call | Method / route | Request | Response | Auth / authorization | Replay / parity / security | Staging |
|---|---|---|---|---|---|---|
| login | POST signin | JSON credentials | BaseResponse<LoginResponse> | public | golden parity; token-safe log | Shadow ready |
| resetPassword | POST resetPassword | email query | BaseResponse<String> | public | characterized | Shadow ready |
| updateProfile | PUT updateUserDetails | identity queries + JSON | BaseResponse<ImageProfileResponse> | self/admin in enforce | legacy body; spoof policy | Shadow ready after Bearer |
| getAssignmentsActive | GET getassignmentsActiveUploadFinish | rigger_email | AssignmentActiveTodayResponse | unresolved | route absent | Blocked |
| getAssignmentsUploadFinishById | GET getassignmentsActiveUploadFinishById | rigger/id/status | BaseListResponse<AssignmentData> | unresolved | route absent | Blocked |
| getAssignmentById | GET getassignmentsById | assignment_id | BaseResponse<AssignmentData> | owner/coordinator/admin | golden read parity | Shadow ready after Bearer |
| getDropReason | GET getRejectDropReasonList | none | BaseListResponse<String> | public | exact static list | Shadow ready |
| updateAssignment | PUT updateAssignmentDetails | identity queries + JSON | BaseResponse<AssignmentUpdateStateResponse> | owner/coordinator/admin | state-specific replay/failure tests | Partial: Accept/Check-in deferred |
| updateFullTowerAdditionalData | PUT updateImageDetails | assignment/identity + JSON | BaseResponse<AssignmentFullTowerResponse> | parent Assignment | characterized | Shadow ready after Bearer |
| updateCellDetails | PUT updateCellDetails | rcell/identity + JSON | BaseResponse<AssignmentCellResponse> | Assignment/Cell relationship | replay/failure covered | Shadow ready after Bearer |
| updateJustification | PUT updateImageDetails | assignment/identity + JSON | BaseResponse<JustificationResponse> | parent Assignment | characterized | Shadow ready after Bearer |
| getUtility | GET getUtility | none | BaseListResponse<UtilityResponse> | public | golden parity | Shadow ready |
| getFullTowerData | GET getImageDetails | assignment_id | BaseResponse<FullTowerResponse> | parent Assignment | golden parity | Shadow ready after Bearer |
| getCellData | GET getCellDetails | assignment_id | BaseListResponse<CellDataResponse> | Assignment access | golden parity | Shadow ready after Bearer |
| getAorSummaryById | GET getAorSummaryById | assignment_id | BaseResponse<AORResponse> | Assignment access | ordered composite parity | Shadow ready after Bearer |
| setUploadedImage | PUT updateImageDetails | assignment/identity + JSON | BaseResponse<JustificationResponse> | parent Assignment | characterized | Shadow ready after Bearer |
| getCatalogs | GET getCatalogs | t query | BaseResponse<CatalogResponse> | unresolved | route absent | Blocked |

The redevelopment additionally exposes support routes not currently declared by Retrofit: getCurrentTime, getCellDetailsPerSector, and signout. Android source is unchanged.