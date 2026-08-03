# Radaba Security

## Session boundary

- The client signs in directly with Firebase Auth using in-memory persistence.
- The Firebase ID token exists only long enough to exchange it with `POST /api/auth/login` and is never stored in localStorage, sessionStorage, Redux, or a readable cookie.
- `__session` contains only the Firebase Admin session cookie. It is `HttpOnly`, `SameSite=Lax`, `Path=/`, has a seven-day maximum age, and is `Secure` in production.
- Protected routes call `verifySessionCookie` with revocation checking enabled.
- Logout never supplies a raw cookie to `revokeRefreshTokens`; it first decodes the session and revokes by decoded `uid`.
- Cookie clearing runs even if session verification or revocation fails.

## Secrets

Never commit or expose environment files, service-account JSON, private keys, passwords, ID tokens, session-cookie values, or application credentials. Secret files must not be placed under `public/` or `src/`.

## Database compatibility

RTDB remains the source of truth. Authentication reads the existing `user` and `privilege` paths and preserves field names, types, query shape, status behavior, and privilege behavior.

## Authenticated shell

- `/home` remains protected by the server layout and shared revocation-aware resolver.
- The resolver is called once by the layout; client shell components do not fetch or establish identity.
- The client receives only display-safe user fields: name, email, role, and optional status, company, department, region, and phone.
- Firebase UID, session identifiers, tokens, cookie values, and raw privilege JSON are not displayed or passed into shell controls.
- Sidebar, drawer, and menu state is held only in React memory and is not stored in localStorage or sessionStorage.
- Logout continues to use the Phase 4 endpoint.
- Phase 5 performs no RTDB writes and introduces no schema fields.

## Assignment authorization

Assignment reads remain server-only through Firebase Admin. Access requires an existing privilege entry whose path is exactly `/assignment` and whose boolean property for the authenticated user's role is exactly `true`. Menu visibility is not authorization. Phase 7A introduces no action permission or Assignment write surface.

## Assignment CSV security

The export route never trusts client role or identity. It re-verifies the server session and exact `/assignment` privilege, applies a 5,000-row limit, returns sanitized errors, and sets `private, no-store`. CSV cells beginning with `=`, `+`, `-`, or `@` receive an apostrophe prefix before RFC 4180 escaping to prevent spreadsheet formula injection.

## Administrator authorization and lockout safety

Administrator identity is always derived from the revocation-aware server session. Client role, URL state, and browser storage are ignored. Access requires active `super_admin` plus strict `/privilege` authorization. Field commands re-read targets, compare previous values, and protect the final active administrator and final `/privilege` access. Check-then-write races remain documented; no broad root transaction or session revocation was introduced.

User Detail optionally calls Firebase Admin `getUser` only after server authorization and a direct RTDB profile read. The browser receives only UID, email, email verification, disabled state, creation/last-sign-in strings, and provider identifiers. Raw Auth records, provider objects, custom claims, tokens, cookies, error details, and service-account information are never serialized. Auth failure cannot bypass RTDB authorization or prevent the RTDB profile from rendering.

Administrator audit is server-only and append-only. Records contain bounded safe snapshots and server-derived administrator/request context. Defensive filtering removes password, token, cookie, session, secret, credential, private-key, authorization, and custom-claim keys recursively. Audit failures log only sanitized action/resource/request identifiers and cannot alter the authoritative administrative result.

User provisioning uses the same active `super_admin` and strict `/privilege` boundary. Temporary passwords are generated server-side, passed only to Firebase Admin, and never returned, logged, displayed, or audited. Duplicate emails are checked against Auth and RTDB. RTDB failure triggers Auth deletion; failed compensation is surfaced with a request identifier and sanitized internal log.

Account deactivation, reactivation, and session revocation use the same administrator boundary and never trust client identity. Final-active-administrator protection runs before Firebase changes. Status and session commands require explicit confirmation, with an additional self-revocation confirmation. Lifecycle operations preserve UID and password, use Firebase refresh-token revocation, and surface cross-system rollback failures with sanitized request identifiers.

Audit Center list and detail routes authorize before any audit read. Raw RTDB records are mapped to bounded display DTOs and snapshots are defensively sanitized again. Search excludes snapshot contents. The read repository has no append, update, or delete method, and audit inspection never records an audit event.

Role assignment no longer trusts dynamic privilege-field discovery. Only centralized assignable identifiers are accepted. Authorization still requires strict boolean `true` at the exact mapped role property; no alias broadens access.

## Bulk import security

Template, validation, and commit require a verified Active session and strict /assignment privilege. File size, extension, MIME, UTF-8, headings, rows, field lengths, and references are server validated.

## Completed Assignment rigger immutability

Rigger locking is enforced server-side and does not trust browser state. The command service rejects an actual Rigger change on a completed record, while an identical trusted Rigger is a no-op. The Firebase repository repeats both the Rigger identity comparison and completion check inside an RTDB transaction before applying any Rigger fields. A concurrent completion aborts the transaction. UI disabling is presentation only; manual REST clients and future frontends receive the same HTTP 409 `ASSIGNMENT_COMPLETED` response. No audit node is created because no Assignment audit contract is confirmed.

## Assignment revisit authorization

The revisit endpoint derives identity and `/assignment` permission from the existing revocation-aware server session. It accepts a trimmed required reason up to 2,000 characters. Both the command service and the RTDB transaction require the current record to be completed; active, cancelled, deleted, or archived requests receive HTTP 409 `ASSIGNMENT_NOT_COMPLETED` without a database update. Browser visibility is presentation only and direct clients cannot bypass the server checks.

## Assignment workflow transitions

Workflow actions require the existing active session and strict `/assignment` privilege. No client role, state, timestamp, or next-state value is trusted. The server maps the bounded `accept`, `start`, or `pause` action to established fields, and an RTDB transaction validates the latest state before applying the complete field set. Invalid or concurrently stale transitions return HTTP 409 without a partial update. No action-specific role override or new audit node is introduced.

### Resume and completion enforcement

The bounded transition API also accepts `resume` and `complete`. The server passes the authenticated actor into the transaction; only completion persists `completed_by_uid` and `completed_by_name`. The transaction requires the latest state to be `Paused` for Resume or `On Progress` for Complete. Concurrent, repeated, stale, or out-of-order requests abort with HTTP 409 and no partial update.

## Assignment photo evidence security

Photo listing, upload, content, and delete routes require the existing revocation-aware Active session and strict `/assignment` privilege. Uploader UID/name and Jakarta timestamp are derived by the server. Category, quota, size, MIME, and magic bytes are server validated; original filenames never determine Storage paths.

Objects and metadata are resolved beneath the trusted Assignment push key. Upload and delete never accept arbitrary Storage paths. Completed evidence is read-only. Deletion requires uploader ownership, matching coordinator email, or `super_admin`. `storage.rules` denies all direct client access; Firebase Admin operations are the only supported Storage path.

Storage rules are not deployed automatically. Deployment requires review of the target Firebase project, bucket IAM, and production request-size behavior. Cross-service cleanup is best-effort because RTDB and Storage cannot share a transaction, and partial failures are surfaced for operational follow-up.

## Assignment work execution security

Checklist and Work Report routes derive the Active session, exact `/assignment` privilege, UID, name, email, and role server-side. Zod bounds every payload. A transaction on the latest `assignment/{pushKey}` repeats Completed detection, assigned-Rigger/Coordinator/`super_admin` authorization, and optimistic revision validation before replacing only the requested section. Client identity, timestamps, labels for default items, and persisted revision are not trusted.

Completed edits and stale revisions return HTTP 409 without a partial update. Checklist/report content creates no HTML, inventory write, general audit node, local draft, or timeline event.

## Tower directory security

Tower pages and GET APIs independently require a verified revocation-checked session, an existing Active user, and strict role access on exact path `/assignment`. `super_admin` is not a bypass. Reads are server-only and bounded.

Tower creation is separate from read access. `POST /api/towers` requires the verified Active `super_admin` and strict `/privilege` administrator boundary. The server rejects unknown fields, validates required values and coordinate/radio bounds, owns push-key generation, and checks normalized Tower ID uniqueness inside the same collection transaction that appends the new child. Client button visibility and native validation are presentation only.

## Related Assignment reads

Related Assignment data is resolved only after the Tower detail page verifies an Active session and strict `/assignment` privilege. Empty Tower IDs cause no Assignment query, Firebase failures are sanitized into a local section state, and no `super_admin` bypass, browser Firebase read, raw snapshot, or mutation route exists.

## Tower map security

The Tower map repeats Active strict `/assignment` authorization and sends only the minimal marker contract to the browser. It uses a local MapLibre background style with no external tile provider, so operational viewport coordinates are not disclosed to an unapproved host. Popup DOM uses `textContent`; no raw errors, snapshots, user data, Assignment data, or writes are exposed.
## Tower bulk import

Template, validation, and commit independently require an authenticated Active `super_admin` with strict `/privilege` access. Uploads are bounded, decoded as strict UTF-8, schema-whitelisted, reparsed at commit, and returned without Firebase paths or stack traces.
## Tower audit security

History reads require an authenticated Active user with exact `/assignment` access. Audit writes have no public API and occur only inside strict administrator-authorized Tower Create/Edit/Import commands. Actor, timestamp, source, action, before, and after values are never accepted from browser input.
# Mobile v1 compatibility boundary

M4R deliberately does not add global authentication or authorization. Secure behavior is deferred to an approved v1 change or mobile v2.
# Phase M6R preserved boundary

The M6R v1 reads remain unauthenticated and expose legacy raw read errors. This
is documented compatibility risk; no security policy or credential handling changed.
# Phase M8R preserved risk

The image metadata route remains unauthenticated, ownership-free, URL-unvalidated,
replay-sensitive, duplicate-prone, and partially non-atomic.

## Mobile Finished v1 risk

The compatibility route intentionally preserves unauthenticated arbitrary-ID completion, cross-rigger fan-out, raw errors, replay increments, and partial writes. No Auth or Storage mutation was added.

## Mobile lifecycle recovery exposure

A 500 response can follow partial Finished writes and does not prove rollback. Operators must inspect the ordered path boundary; automatic retry or compensation is prohibited without a separately approved design.

## Mobile hardening (M11R)

MOBILE_API_SECURITY_MODE accepts only legacy-compatible, observe, or enforce and defaults to legacy-compatible. This phase rejects production enforce. Verification checks token revocation; authorization uses active existing profiles, proven roles, and route-specific object relationships. See mobile-api-security/.

## M13R operational security

Operational logs hash actor identity and exclude credentials, headers, cookies, bodies, private Firebase values, and raw provider errors. Invalid flags fail evaluation. Production readiness blocks nonzero rollout and the existing M11 guard still rejects production enforcement.


## R15C Tower workspace security

The route requires the existing revocation-aware Active session and strict `/assignment` privilege before reads. Firebase Admin remains server-only. Tokenized image URLs are used only internally by authorized image elements and are excluded from visible metadata, export, IDs, logs, analytics, and errors.


## R17 report security

Report list and detail routes require an Active verified session and strict `/assignment` privilege. Deterministic IDs exclude URLs and tokens. Full report URLs are excluded from visible metadata, exports, IDs, logs, analytics, errors, and shared caches; authorized actions use `noopener noreferrer`.
