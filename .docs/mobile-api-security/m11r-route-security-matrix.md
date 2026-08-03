# M11R route security matrix

This matrix was completed before M11R runtime changes. The current Android
interceptor does not send `Authorization`; its Bearer code is commented out.
The compatibility APIs currently verify no token.

| Route | Android method | Intent | Current token | Verified/active/role/owner | Request identity | Write scope | Risk | Enforcement target |
|---|---|---|---|---|---|---|---|---|
| signin | POST | Public authentication | Credentials | No/No/No/No | email trusted for login only | Auth, user/privilege reads, log | Critical | Public; safe login handling |
| resetPassword | POST | Public recovery | None | No/No/No/No | email trusted | Auth action | High | Public; sanitized errors |
| getCurrentTime | none/current unproven | Public support | None | No/No/No/No | none | none | Low | Public |
| getRejectDropReasonList | GET | Public support | None | No/No/No/No | none | none | Low | Public |
| getUtility | GET | Public bootstrap/update policy | None | No/No/No/No | none | none | Medium | Public |
| signout | no current caller | Session termination | Cookie in legacy source | Broken | cookie trusted unsafely | intended Auth revoke | High | Authenticated when token present; idempotent missing-token success |
| getassignmentsById | GET | Assignment detail | None | No/No/No/No | assignment_id trusted | read assignment | High | Active owner, related coordinator, or explicit Administrator |
| getCellDetails | GET | Assignment Cells | None | No/No/No/No | assignment_id trusted | read cell | High | Active Assignment access |
| getImageDetails | GET | Assignment image metadata | None | No/No/No/No | assignment_id trusted | read image | High | Active Assignment access |
| getAorSummaryById | GET | Assignment composite | None | No/No/No/No | assignment_id trusted | read assignment/cell/image | High | Active Assignment access |
| getCellDetailsPerSector | any; unproven caller | Sector detail | None | No/No/No/No | rcell_id trusted | read cell | High | Active access through Cell-to-Assignment relationship |
| updateUserDetails | PUT | Profile update | None | No/No/No/No | email/body trusted | broad matching user update | Critical | Active self or explicit Administrator |
| updateAssignmentDetails | PUT | Lifecycle mutation | None | No/No/No/No | assignment/rigger fields trusted | assignment and Finished fan-out | Critical | Active owner, related coordinator, or explicit Administrator |
| updateImageDetails | PUT | Metadata and Cell height | None | No/No/No/No | assignment/body trusted | image plus optional Cell fan-out | Critical | Active Assignment access; parent relationship |
| updateCellDetails | PUT | Cell/Sector upsert | None | No/No/No/No | assignment/rcell/body trusted | cell update-all or push | Critical | Active Assignment access plus rcell relationship |

No implemented mobile route has a proven system/internal classification.
Coordinator relationship fields are existing Assignment
`coordinator_email`/`rno_email`; owner is existing `rigger_email`.
Administrator is the explicit existing role value `Administrator`, not a
hidden bypass. Unknown roles are violations.
