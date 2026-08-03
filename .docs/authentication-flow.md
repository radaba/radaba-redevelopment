# Radaba Authentication Flow

## Phase 4 login

1. The browser configures Firebase Auth with in-memory persistence.
2. The browser calls Firebase `signInWithEmailAndPassword` and obtains the Firebase ID token from the returned user.
3. The browser sends `{ "idToken": "..." }` to `POST /api/auth/login`. Email and password are not sent to the application server.
4. Firebase Admin verifies the ID token. The server uses only the decoded `uid` and normalized decoded `email` as trusted identity claims.
5. The server queries the existing RTDB `user` node by lowercased email, rejects `status: not active`, and loads privileges from `privilege/{role}` without changing the legacy record shape.
6. Only after those checks pass, Firebase Admin creates a seven-day session cookie with `createSessionCookie`.
7. The route writes that value to `__session` and redirects the UI to `/home/assignment`.
8. The temporary client Firebase user is signed out; the ID token is not retained in browser storage.

## Protected routes

The shared resolver reads `__session`, calls `verifySessionCookie(cookie, true)` with revocation checking, then resolves the RTDB user and privileges again from decoded claims. Missing, invalid, expired, or revoked sessions are unauthorized.

## Logout

Logout decodes the Firebase session cookie before optional revocation and calls `revokeRefreshTokens` only with the decoded `uid`. The `__session` cookie is cleared in a `finally` path even when verification or revocation fails.

## Password reset

The reset dialog continues to use Firebase Admin password-reset links and does not modify RTDB fields.
