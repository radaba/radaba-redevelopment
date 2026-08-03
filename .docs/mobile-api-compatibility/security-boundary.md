# Security boundary

M4R deliberately preserves v1 security behavior:

- no global authentication or authorization enforcement
- `getCellDetails` remains unauthenticated
- raw Firebase error messages remain exposed
- no sign-in/sign-out behavior is implemented or corrected

Auth and policy modules are interfaces only. They do not add an administrator
bypass and are not invoked by current v1 routes. Secure behavior belongs in an
explicitly approved compatibility change or `/api/mobile/v2/*`.

Fixtures contain no secrets. Environment values are read only by the existing
Firebase Admin module; tests use fakes.

M8R preserves unauthenticated arbitrary image URL/metadata writes, Assignment
and Cell IDOR, cross-rigger writes, duplicate creation, partial fan-out, raw
errors, and absence of content validation.

M6R intentionally leaves `getCellDetailsPerSector` and `getUtility` public and
keeps raw Firebase error exposure. Neither route invokes Auth, ownership, active
status, roles, privileges, Storage, login logs, or metrics. Hardening remains a
separately approved v1 change or future v2 policy.

## M9R-B

Unauthenticated cross-rigger Assignment writes and raw Firebase errors remain for four approved states. Unsupported states return 400 before Firebase access. No Cell, image, Tower, metric, or achievement write is reachable.


## M9R-C

Finished remains unauthenticated and ownership-free, allowing arbitrary Assignment IDs and cross-rigger completion. Raw errors, partial writes, replay increments, user-profile status fan-out, and IDOR are preserved. Auth and Storage are not mutated.


## M9R-D exposure review

The lifecycle surface remains unauthenticated, ownership-free, raw-error exposing, and replay-sensitive. Static shadow checks constrain writes to assignment, cell, image, tower, user, and achievement; Auth, Storage, metrics, and repair markers remain excluded.

## M10R

updateCellDetails preserves public arbitrary-field Cell upserts, raw errors, duplicate creation risk, and cross-assignment IDOR. Its repository is statically constrained to the existing cell root; Auth, Storage, logs, metrics, and other RTDB roots are excluded.

## M11R boundary

Protected routes now evaluate verified Firebase identity, active profile, explicit role, and object relationships. Legacy-compatible and observe preserve responses; enforce blocks with sanitized legacy-shaped errors. Tokens, cookies, headers, bodies, coordinates, and raw Firebase errors are excluded from audits.
