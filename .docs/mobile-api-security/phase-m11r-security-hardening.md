# Phase M11R security hardening

## Outcome

The mobile compatibility API now has one policy registry, token resolver, Firebase Admin verifier with revocation checking, profile/role/relationship evaluator, safe enforce-mode errors, identifier validation, and sanitized observe-mode audit output. Login logs no longer persist ID tokens. Logout revokes refresh tokens when an authenticated token is supplied and clears the compatibility cookie.

## Intentional changes

`enforce` rejects missing/invalid authentication, inactive or unknown profiles, unknown roles, identity spoofing, unsafe IDs, and unrelated objects. Successful handler responses are unchanged. Server failures are sanitized in enforce mode. `legacy-compatible` and `observe` retain handler behavior; observe only emits sanitized decisions.

No schema or transaction change was made. Existing fan-out/replay behavior remains documented and deferred where an Android request ID or schema-backed idempotency record is necessary.