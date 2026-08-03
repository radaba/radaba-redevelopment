# Radaba API Contract

All endpoints return `{ "success": true, "data": ... }` or `{ "success": false, "error": "..." }`.

## POST `/api/auth/login`

Request:

```json
{ "idToken": "Firebase ID token" }
```

A missing token returns `400`; an invalid token or rejected RTDB user returns `401`. Success returns the legacy-compatible user payload and `redirectTo: "/home/assignment"`, and sets `__session` to only the Firebase Admin session-cookie value.

## GET `/api/auth/session`

Reads `__session`, verifies it with revocation checking, and returns the current legacy-compatible RTDB user and privilege payload. Missing, invalid, expired, or revoked cookies return `401`.

## POST `/api/auth/logout`

Decodes the session cookie, revokes refresh tokens by decoded `uid` when possible, and always expires `__session`. Logout is successful and idempotent even for an invalid cookie.

## POST `/api/auth/reset-password`

Accepts `{ "email": "user@example.com" }` and returns `{ "success": true, "data": { "success": true } }` after Firebase accepts the reset request.

## GET `/api/assignments/export`

Requires the verified `__session` and exact `/assignment` role privilege. It accepts the Assignment list URL contract and returns UTF-8 BOM-prefixed CSV with `Content-Disposition`, or JSON errors: `401` unauthenticated, `403` denied, `413` over 5,000 rows, and sanitized `503` repository failure. The endpoint performs no writes.

## Administrator APIs

All `/api/admin/*` routes independently require an active verified `super_admin` with strict `/privilege` access. Read endpoints are `GET /api/admin/users`, `GET /api/admin/roles`, and `GET /api/admin/privileges`. Commands are `PATCH /api/admin/users/{userId}/role`, `PATCH /api/admin/users/{userId}/status`, and `PATCH /api/admin/privileges/{privilegeId}`. Responses use 400 malformed, 401 unauthenticated, 403 denied, 404 missing, 409 stale/safety conflict, 422 unsupported value, and sanitized 500 errors.

## Assignment import APIs

Protected endpoints: GET /api/assignments/import/template, POST /api/assignments/import/validate, and POST /api/assignments/import/commit. POST requests use multipart field file.

## Revisit Assignment

`POST /api/assignments/{assignmentId}/revisit`

Authenticated request body:

```json
{ "reason": "Incorrect installation. Need additional work." }
```

Success returns `{ "success": true, "data": { ... } }`. A non-completed Assignment returns HTTP 409:

```json
{
  "success": false,
  "code": "ASSIGNMENT_NOT_COMPLETED",
  "message": "Only completed assignments can be revisited."
}
```

Authentication, authorization, missing-record, and validation errors continue using the shared Assignment API error boundary. The route does not accept status, user identity, or metadata fields from the client.

## Assignment workflow transition

`POST /api/assignments/{assignmentId}/transition`

Request:

```json
{ "action": "accept" }
```

Allowed actions are `accept`, `start`, and `pause`. Authentication and authorization use the shared Assignment boundary. The current persisted state determines whether the requested action is valid; invalid or stale actions return HTTP 409 with code `ASSIGNMENT_INVALID_TRANSITION`. Status values and timestamps are server-controlled.

### Resume and Complete actions

The Assignment transition action enum additionally accepts `resume` and `complete`. `resume` requires latest state `Paused`; `complete` requires latest state `On Progress`. The client cannot provide state, status, actor, or timestamp. Invalid or duplicate transitions return HTTP 409 `ASSIGNMENT_INVALID_TRANSITION`.

## Assignment photo evidence API

- `GET /api/assignments/{assignmentId}/photos` lists trusted metadata for the Assignment.
- `POST /api/assignments/{assignmentId}/photos` accepts one multipart image with `photoId`, `category`, `file`, optional `thumbnail`, and optional `caption`.
- `GET /api/assignments/{assignmentId}/photos/{photoId}/content` streams an authorized original or thumbnail.
- `DELETE /api/assignments/{assignmentId}/photos/{photoId}` applies the approved ownership/coordinator/administrator rule.

All routes require an Active session and strict `/assignment` access, return private non-cacheable metadata responses, and resolve uploader identity, timestamps, Assignment scope, and Storage paths on the server.

## Assignment work execution API

- `PUT /api/assignments/{assignmentId}/checklist` replaces the bounded checklist section using `expectedRevision`.
- `PUT /api/assignments/{assignmentId}/work-report` replaces the bounded report section using `expectedRevision`.

Both require an Active strict `/assignment` session and an assigned Rigger, matching Coordinator, or `super_admin` actor on an active Assignment. The server owns default checklist labels, actor metadata, Jakarta timestamps, and revision increments. Completed, unauthorized, ambiguous, or stale requests write nothing.

## Tower APIs

`GET /api/towers` provides an authorized bounded cursor result. `GET /api/towers/{towerKey}` reads one child. Both require the exact Assignment access boundary, set `private, no-store`, return sanitized DTOs, and expose no write verbs.

## Phase 8B API decision

No `/api/towers/{towerKey}/assignments` endpoint is introduced. The authorized Tower server page calls the existing Assignment read repository directly, avoiding a redundant browser request. Existing Tower and Assignment APIs remain unchanged.

## Phase 8C API decision

No `/api/towers/map` endpoint is added. The authorized server route reads the existing Tower repository and passes a bounded marker DTO directly to the dynamically imported canvas. Existing APIs and mutation surfaces are unchanged.

## Rigger APIs

`GET /api/riggers` returns the authorized bounded directory DTO with URL query validation. `GET /api/riggers/{riggerKey}` returns a sanitized profile plus bounded Assignment workload/history or 404. Both independently require the strict Active Assignment session, set `private, no-store`, and expose no mutation verbs.
## Tower import

Strict-administrator endpoints: `GET /api/towers/import/template`, `POST /api/towers/import/validate`, and `POST /api/towers/import/commit`. Multipart requests use a `file` field. Validation is read-only; commit reparses and atomically creates all rows or none.
## Tower history

`GET /api/towers/[towerKey]/history` uses the existing Active strict `/assignment` read boundary. It accepts push-key `cursor` and page sizes 25, 50, or 100 and returns one bounded newest-first page. No audit write or export API exists.
# Mobile v1 exception

`/api/mobile/*` preserves legacy response contracts and must not be converted to the redevelopment web envelope. See `.docs/mobile-api-compatibility/route-mapping.md`.
# Phase M6R mobile reads

`/api/mobile/getCellDetailsPerSector` and `/api/mobile/getUtility` preserve the
legacy envelope, method fallthrough, HTTP 200 empty outcomes, raw 500 messages,
casing, runtime types, duplicates, and ordering.
# Phase M8R image write

`/api/mobile/updateImageDetails` preserves arbitrary JSON pass-through, legacy
envelopes, fan-out order, push-on-missing behavior, and raw errors.

## Mobile Finished compatibility

/api/mobile/updateAssignmentDetails accepts the proven Finished JSON body and returns the legacy code/message/data envelope. Missing Assignment is HTTP 200; thrown workflow errors are raw HTTP 500 envelopes.

## Mobile lifecycle replay contract

Supported lifecycle writes have no idempotency key or legal source-state validation. Duplicate simple requests rewrite timestamps/indexes; duplicate Finished requests repeat fan-out and increment achievement counters.

## Mobile security contract (M11R)

Successful compatibility DTOs are retained. Enforce-mode failures use legacy envelopes with 400 unsafe input, 401 unauthenticated, 403 unauthorized, 404 hidden object, existing 409 conflicts, and sanitized 500 responses. Bearer authentication precedes the existing session cookie; body/query tokens are unsupported.


## R15C API decision

No Tower workspace API is added. The authorized Server Component calls the bounded server repository directly. Existing Tower, Assignment, Cell, image, and mobile endpoints are unchanged.


## R17 API decision

No Report API, upload, delete, replacement, approval, or PDF proxy endpoint is added. Authorized Server Components call the bounded report repository and existing tokenized Storage URLs are used directly for browser preview/download.

## R20B Tower dependency viewer

`GET /api/towers/[towerKey]/dependencies` requires strict administrator authorization and returns a private, uncached, bounded read-only aggregation from existing Tower, Assignment, Cell, legacy image metadata, Assignment photo metadata, derived report, and Tower audit paths. It creates no index or schema and cannot prove delete safety.
