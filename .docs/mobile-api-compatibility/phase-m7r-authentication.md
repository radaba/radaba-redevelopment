# Phase M7R: Authentication and profile compatibility

M7R implements the four routes proven by the legacy inventory: `signin`,
`signout`, `resetPassword`, and `updateUserDetails`.

`signin` accepts body `email`, `password`, optional `browser` and `ip_address`.
It authenticates through Firebase client Auth, reads `user` by lower-cased email,
reads `privilege` ordered by `category`, builds the three legacy menu groups,
sets the 30-day HTTP-only `__session` ID-token cookie, and fire-and-forgets one
`log` push containing the token. Missing credentials are 400; mapped Auth errors
are 401; other failures are raw-message 500.

`resetPassword` accepts query `email`, performs the proven Firebase Auth action,
and preserves the exact success string plus mapped 401/raw 500 outcomes.

`updateUserDetails` accepts query `email` and an arbitrary JSON body, updates all
matching `user` children, and returns the body even when no user matches. This
unauthenticated broad write/IDOR risk is intentionally preserved.

`signout` is not repaired. Without a cookie it throws `signOut is not defined`;
with a cookie it throws `sessionCookie is not defined`. App Router surfaces the
platform error, matching the non-viable legacy implementation as closely as
possible.

Android proves POST login (`BaseResponse<LoginResponse>`), POST reset
(`BaseResponse<String>`), and PUT profile (`BaseResponse<ImageProfileResponse>`).
No current Retrofit signout caller exists. Tests use fakes and sanitized tokens;
no operational Auth/RTDB call occurs.

Rollback removes the four M7R route directories and auth/profile-specific
repository, service, handler, fixture, and test files. Security hardening,
Android cutover, and deployment remain separate approvals.
