# M11R mobile security policy

## Rollout modes

`MOBILE_API_SECURITY_MODE` accepts exactly `legacy-compatible`, `observe`, or
`enforce`. Missing configuration defaults to `legacy-compatible`. Invalid
values fail closed at configuration evaluation. An `enforce` value is rejected
when `NODE_ENV=production`; M11R cannot enable production enforcement.
Client headers, query values, cookies, and bodies cannot select the mode.

- **legacy-compatible:** protected policy is evaluated; violations do not
  block and are not emitted. Existing client behavior remains.
- **observe:** violations do not block; one sanitized structured decision is
  emitted without tokens, cookies, bodies, raw errors, private URLs, or exact
  coordinates.
- **enforce:** missing/malformed/invalid/expired/revoked credentials return a
  legacy-shaped 401; inactive, disabled, unknown-role, ownership, relationship,
  privilege, or identity violations return 403 or object-hiding 404. Internal
  failures are sanitized.

## Credentials and principal

Supported proven locations are `Authorization: Bearer <Firebase ID token>`
(present but commented in the inspected Android interceptor) and the legacy
`__session` cookie set by signin. Bearer has precedence. Other headers, query
tokens, and body tokens are ignored. Admin verification checks revocation.

The verified UID/email resolves existing `user` records. Exactly one matching
profile is required. `status` must equal `Active`, `disabled` must not be true,
and the profile UID/email must agree with verified claims. Trusted identity
comes only from verified claims plus that profile.

## Route authorization

Public routes are signin, resetPassword, getCurrentTime,
getRejectDropReasonList, and getUtility.

Protected Assignment access permits:

- the exact case-insensitive `rigger_email` owner;
- a related coordinator whose email equals existing `coordinator_email` or
  `rno_email`, with role/position `Coordinator` or `RNO`; or
- the explicit existing `Administrator` role.

Cell/Sector and image access is derived through the existing
`assignment_id`. Cell requests must also use an `rcell_id` whose encoded suffix
and any existing Cell relationship agree with that Assignment. Profile updates
are self-only except for explicit Administrator.

No request-supplied role, status, owner, coordinator, UID, or privilege is
trusted. No identity is silently rewritten in compatibility/observe mode.

## Identifiers and errors

In enforcement mode, security-sensitive identifiers must be non-empty bounded
strings and must not contain RTDB-forbidden/path characters `. # $ [ ] /`,
control characters, leading/trailing whitespace, or path traversal. Valid
legacy numeric strings and Unicode text remain unchanged.

Successful service responses keep legacy DTO envelopes. Security denials also
use `{code,message,data}` without Firebase details. Enforce mode replaces raw
500 bodies with `Internal mobile API error`.

## Replay and atomicity

M11R adds no schema, idempotency record, request-ID contract, transaction, or
multi-location rewrite. Authentication and relationship checks reduce
unauthorized replay but do not make authorized writes idempotent or atomic.
