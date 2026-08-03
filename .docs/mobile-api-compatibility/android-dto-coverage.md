# Android DTO coverage

The selected routes are referenced by the legacy Android Retrofit interface:

| Android call | Compatibility route | DTO shape covered |
| --- | --- | --- |
| `getAssignmentById` | `getassignmentsById` | `AssignmentData` scalar, boolean, null, and numeric-like fields |
| `getFullTowerData` | `getImageDetails` | `FullTowerResponse` tower/image fields and nullable status |
| `getAorSummaryById` | `getAorSummaryById` | `AORResponse`: assignment object, cell array, image object |

Golden fixtures are sanitized and use `example.invalid`. They cover response
envelopes, first-duplicate behavior, empty snapshots, error asymmetry, exact
read order, and the legacy AOR `tower_height` overwrite. This is contract
coverage, not live Firebase or Android integration testing.

## M6R

`ApiService.getUtility()` is a parameterless GET returning
`BaseListResponse<UtilityResponse>`. Golden coverage includes `app_url`,
`app_version`, `banner`, `distance`, `geolocation`, `force_update`, and
`maintenance`; Android consumes these across login and home.

No current Retrofit method calls `getCellDetailsPerSector`. Its raw records use
the already-covered `CellDataResponse` field contract. Returned extra fields may
be ignored by Gson, and absent Java fields retain DTO defaults. Android source
was inspected only and not modified.
# M8R image writes

Android declares three `@PUT("updateImageDetails")` methods with identity query
fields and arbitrary `JsonObject` bodies. M8R preserves the bodies for
`AssignmentFullTowerResponse` and `JustificationResponse`; legacy ignores the
identity queries.

## M9R-C Finished

ReportHelper directly sends Finished, assignment_id, tower_id, rigger_email, report_name, report_url, plural images_status, and Closed assignment_status through PUT updateAssignmentDetails. AssignmentUpdateStateResponse consumes assignment_state, assignment_status, closed_date, and closed_datetime; extra indexes are ignored. The legacy singular image_status read leaves Android's plural field unused.


## M9R-D lifecycle coverage

Paused, Rejected, Dropped, On Progress, and Finished have characterized Android request/response coverage. Accepted, Checkin, Go, completed, and updateAssignmentToClosedByID remain deferred rather than inferred.
