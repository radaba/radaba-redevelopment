# Definitive API reference

All routes below are supported unless a later approved API decision says otherwise. Removed is always No in M14R because no route had evidence-backed zero production usage.

| Route | Method | Purpose | Authentication | Authorization | Owner | DTO | Status | Deprecated | Removed |
|---|---|---|---|---|---|---|---|---|---|
| `/api/admin/privileges/[privilegeId]` | PATCH | Administration | Session | Active Administrator plus exact privilege | Administration | JSON command/read contract | Supported | No | No |
| `/api/admin/privileges` | GET | Administration | Session | Active Administrator plus exact privilege | Administration | JSON command/read contract | Supported | No | No |
| `/api/admin/roles` | GET | Administration | Session | Active Administrator plus exact privilege | Administration | JSON command/read contract | Supported | No | No |
| `/api/admin/users/[userKey]/role` | PATCH | Administration | Session | Active Administrator plus exact privilege | Administration | JSON command/read contract | Supported | No | No |
| `/api/admin/users/[userKey]/sessions` | POST | Administration | Session | Active Administrator plus exact privilege | Administration | JSON command/read contract | Supported | No | No |
| `/api/admin/users/[userKey]/status` | PATCH | Administration | Session | Active Administrator plus exact privilege | Administration | JSON command/read contract | Supported | No | No |
| `/api/admin/users` | GET, POST | Administration | Session | Active Administrator plus exact privilege | Administration | JSON command/read contract | Supported | No | No |
| `/api/admin/audit/export` | GET | Administration audit export | Session | Strict Administrator | Administration | Bounded UTF-8 CSV | Supported | No | No |
| `/api/admin/system-health` | GET | Detailed system health | Session | Strict Administrator | Operations | Sanitized bounded health JSON | Supported | No | No |
| `/api/admin/users/[userKey]/delete-preview` | GET | User deletion impact preview | Session | Strict Administrator | Administration | Bounded preview JSON | Supported | No | No |
| `/api/admin/users/[userKey]/identity-repair/commit` | POST | User identity repair | Session | Strict Administrator | Administration | Audited command JSON | Supported | No | No |
| `/api/admin/users/[userKey]/identity-repair/preview` | POST | User identity repair preview | Session | Strict Administrator | Administration | Bounded preview JSON | Supported | No | No |
| `/api/admin/users/[userKey]/photo` | GET | User photo metadata | Session | Strict Administrator | Administration | Sanitized photo JSON | Supported | No | No |
| `/api/assignments/[assignmentId]/checklist` | PUT | Assignment workflow | Session | Active Assignment privilege and object policy | Assignments | Assignment JSON/CSV/stream contract | Supported | No | No |
| `/api/assignments/[assignmentId]/comments/[commentId]` | DELETE, PATCH | Assignment workflow | Session | Active Assignment privilege and object policy | Assignments | Assignment JSON/CSV/stream contract | Supported | No | No |
| `/api/assignments/[assignmentId]/comments` | GET, POST | Assignment workflow | Session | Active Assignment privilege and object policy | Assignments | Assignment JSON/CSV/stream contract | Supported | No | No |
| `/api/assignments/[assignmentId]/comments/stream` | GET | Assignment workflow | Session | Active Assignment privilege and object policy | Assignments | Assignment JSON/CSV/stream contract | Supported | No | No |
| `/api/assignments/[assignmentId]/photos/[photoId]/content` | GET | Assignment workflow | Session | Active Assignment privilege and object policy | Assignments | Assignment JSON/CSV/stream contract | Supported | No | No |
| `/api/assignments/[assignmentId]/photos/[photoId]` | DELETE | Assignment workflow | Session | Active Assignment privilege and object policy | Assignments | Assignment JSON/CSV/stream contract | Supported | No | No |
| `/api/assignments/[assignmentId]/photos` | GET, POST | Assignment workflow | Session | Active Assignment privilege and object policy | Assignments | Assignment JSON/CSV/stream contract | Supported | No | No |
| `/api/assignments/[assignmentId]/revisit` | POST | Assignment workflow | Session | Active Assignment privilege and object policy | Assignments | Assignment JSON/CSV/stream contract | Supported | No | No |
| `/api/assignments/[assignmentId]/rigger` | PATCH | Assignment workflow | Session | Active Assignment privilege and object policy | Assignments | Assignment JSON/CSV/stream contract | Supported | No | No |
| `/api/assignments/[assignmentId]/transition` | POST | Assignment workflow | Session | Active Assignment privilege and object policy | Assignments | Assignment JSON/CSV/stream contract | Supported | No | No |
| `/api/assignments/[assignmentId]/work-report` | PUT | Assignment workflow | Session | Active Assignment privilege and object policy | Assignments | Assignment JSON/CSV/stream contract | Supported | No | No |
| `/api/assignments/export` | GET | Assignment workflow | Session | Active Assignment privilege and object policy | Assignments | Assignment JSON/CSV/stream contract | Supported | No | No |
| `/api/assignments/import/commit` | POST | Assignment workflow | Session | Active Assignment privilege and object policy | Assignments | Assignment JSON/CSV/stream contract | Supported | No | No |
| `/api/assignments/import/template` | GET | Assignment workflow | Session | Active Assignment privilege and object policy | Assignments | Assignment JSON/CSV/stream contract | Supported | No | No |
| `/api/assignments/import/validate` | POST | Assignment workflow | Session | Active Assignment privilege and object policy | Assignments | Assignment JSON/CSV/stream contract | Supported | No | No |
| `/api/assignments/lookups/categories` | GET | Assignment workflow | Session | Active Assignment privilege and object policy | Assignments | Assignment JSON/CSV/stream contract | Supported | No | No |
| `/api/assignments/lookups/towers` | GET | Assignment workflow | Session | Active Assignment privilege and object policy | Assignments | Assignment JSON/CSV/stream contract | Supported | No | No |
| `/api/assignments/lookups/users` | GET | Assignment workflow | Session | Active Assignment privilege and object policy | Assignments | Assignment JSON/CSV/stream contract | Supported | No | No |
| `/api/assignments` | POST | Assignment workflow | Session | Active Assignment privilege and object policy | Assignments | Assignment JSON/CSV/stream contract | Supported | No | No |
| `/api/auth/login` | POST | Web authentication | Public credentials/recovery | Authentication lifecycle | Authentication | Web auth JSON | Supported | No | No |
| `/api/auth/logout` | POST | Web authentication | Session cookie | Authentication lifecycle | Authentication | Web auth JSON | Supported | No | No |
| `/api/auth/reset-password` | POST | Web authentication | Public credentials/recovery | Authentication lifecycle | Authentication | Web auth JSON | Supported | No | No |
| `/api/auth/session` | GET | Web authentication | Session cookie | Authentication lifecycle | Authentication | Web auth JSON | Supported | No | No |
| `/api/health` | GET | Release identity health | Public | Public minimal health | Operations | Non-sensitive release JSON | Supported | No | No |
| `/api/debug/towers/runtime-check/[towerKey]` | GET | Tower runtime diagnostics | Session | Administrator | Towers | Non-sensitive runtime fingerprint JSON | Supported | No | No |
| `/api/mobile/getAorSummaryById` | DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT | Android compatibility API | Active Firebase principal | Assignment owner/coordinator/Administrator | Mobile compatibility | Legacy Android envelope | Supported | No | No |
| `/api/mobile/getassignmentsById` | DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT | Android compatibility API | Active Firebase principal | Assignment owner/coordinator/Administrator | Mobile compatibility | Legacy Android envelope | Supported | No | No |
| `/api/mobile/getCellDetails` | DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT | Android compatibility API | Active Firebase principal | Assignment owner/coordinator/Administrator | Mobile compatibility | Legacy Android envelope | Supported | No | No |
| `/api/mobile/getCellDetailsPerSector` | DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT | Android compatibility API | Active Firebase principal | Assignment and Cell relationship | Mobile compatibility | Legacy Android envelope | Supported | No | No |
| `/api/mobile/getCurrentTime` | DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT | Android compatibility API | Public | Public policy | Mobile compatibility | Legacy Android envelope | Supported | No | No |
| `/api/mobile/getImageDetails` | DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT | Android compatibility API | Active Firebase principal | Assignment owner/coordinator/Administrator | Mobile compatibility | Legacy Android envelope | Supported | No | No |
| `/api/mobile/getRejectDropReasonList` | DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT | Android compatibility API | Public | Public policy | Mobile compatibility | Legacy Android envelope | Supported | No | No |
| `/api/mobile/getUtility` | DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT | Android compatibility API | Public | Public policy | Mobile compatibility | Legacy Android envelope | Supported | No | No |
| `/api/mobile/resetPassword` | GET | Android compatibility API | Public | Public policy | Mobile compatibility | Legacy Android envelope | Supported | No | No |
| `/api/mobile/signin` | GET | Android compatibility API | Public | Public policy | Mobile compatibility | Legacy Android envelope | Supported | No | No |
| `/api/mobile/signout` | GET | Android compatibility API | Optional verified token | Verified token when supplied | Mobile compatibility | Legacy Android envelope | Supported | No | No |
| `/api/mobile/updateAssignmentDetails` | GET | Android compatibility API | Active Firebase principal | Assignment owner/coordinator/Administrator | Mobile compatibility | Legacy Android envelope | Supported | No | No |
| `/api/mobile/updateCellDetails` | GET | Android compatibility API | Active Firebase principal | Assignment and Cell relationship | Mobile compatibility | Legacy Android envelope | Supported | No | No |
| `/api/mobile/updateImageDetails` | GET | Android compatibility API | Active Firebase principal | Assignment owner/coordinator/Administrator | Mobile compatibility | Legacy Android envelope | Supported | No | No |
| `/api/mobile/updateUserDetails` | GET | Android compatibility API | Active Firebase principal | Self or Administrator | Mobile compatibility | Legacy Android envelope | Supported | No | No |
| `/api/notifications` | GET | Notification Center | Session | Notification owner | Notifications | Bounded notification JSON | Supported | No | No |
| `/api/notifications/[notificationKey]` | PATCH | Notification state | Session | Notification owner | Notifications | JSON command result | Supported | No | No |
| `/api/notifications/read-all` | POST | Notification state | Session | Notification owner | Notifications | Bounded command result | Supported | No | No |
| `/api/profile` | GET, PATCH | Profile | Session | Active self | Profile | Sanitized profile JSON | Supported | No | No |
| `/api/profile/photo` | DELETE, GET, POST | Profile photo | Session | Active self | Profile | Bounded image contract | Supported | No | No |
| `/api/reports-center` | POST | Reports preview/export | Session | Report-specific privilege | Reports | Bounded JSON or UTF-8 CSV | Supported | No | No |
| `/api/search` | GET | Global Search | Session | Entity-specific privilege | Search | Bounded search JSON | Supported | No | No |
| `/api/riggers/[riggerKey]` | GET | Rigger directory | Session | Active Assignment privilege | Riggers | Sanitized rigger JSON | Supported | No | No |
| `/api/riggers` | GET | Rigger directory | Session | Active Assignment privilege | Riggers | Sanitized rigger JSON | Supported | No | No |
| `/api/admin/assignments/tower-snapshot-backfill/preview` | POST | Assignment maintenance | Session | Strict Administrator | Assignments | Bounded preview JSON | Supported | No | No |
| `/api/admin/assignments/tower-snapshot-backfill/commit` | POST | Assignment maintenance | Session | Strict Administrator | Assignments | Per-record repair JSON | Supported | No | No |
| `/api/towers/[towerKey]/dependencies` | GET | Tower operations | Session | Administrator | Towers | Bounded dependency JSON | Supported | No | No |
| `/api/towers/[towerKey]/history` | GET | Tower operations | Session | Assignment read; Administrator for writes | Towers | Tower JSON/CSV | Supported | No | No |
| `/api/towers/[towerKey]/assignment-impact` | POST | Tower operations | Session | Administrator | Towers | Bounded Assignment impact JSON | Supported | No | No |
| `/api/towers/[towerKey]` | GET, PATCH | Tower operations | Session | Assignment read; Administrator for writes | Towers | Tower JSON/CSV | Supported | No | No |
| `/api/towers/export` | GET | Tower transfer | Session | Active Assignment privilege | Towers | Bounded UTF-8 CSV | Supported | No | No |
| `/api/towers/import/preview` | POST | Tower transfer | Session | Strict Administrator | Towers | Validation preview JSON | Supported | No | No |
| `/api/towers/import/preview/template` | GET | Tower transfer | Session | Strict Administrator | Towers | UTF-8 CSV template | Supported | No | No |
| `/api/towers/import/commit` | POST | Tower operations | Session | Assignment read; Administrator for writes | Towers | Tower JSON/CSV | Supported | No | No |
| `/api/towers/import/template` | GET | Tower operations | Session | Assignment read; Administrator for writes | Towers | Tower JSON/CSV | Supported | No | No |
| `/api/towers/import/validate` | POST | Tower operations | Session | Assignment read; Administrator for writes | Towers | Tower JSON/CSV | Supported | No | No |
| `/api/towers` | GET, POST | Tower operations | Session | Assignment read; Administrator for writes | Towers | Tower JSON/CSV | Supported | No | No |
| `/health` | GET | Health/readiness | Public | Operational configuration | Operations | Non-sensitive health JSON | Supported | No | No |
| `/live` | GET | Health/readiness | Public | Operational configuration | Operations | Non-sensitive health JSON | Supported | No | No |
| `/ready` | GET | Health/readiness | Public | Operational configuration | Operations | Non-sensitive health JSON | Supported | No | No |
