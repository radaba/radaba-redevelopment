# User Account Lifecycle

Active `super_admin` users with strict `/privilege` access can deactivate, reactivate, and revoke sessions for existing application users. The existing `Active` and `Not Active` values, UID, password, profile fields, privileges, and RTDB schema remain unchanged.

## Coordinated status changes

Deactivation reads the current Firebase disabled state, disables the Auth account, revokes refresh tokens, then writes RTDB status `Not Active`. Reactivation enables the same Auth UID and then writes RTDB status `Active`; it does not alter the password or profile. The existing final-active-administrator rule is evaluated before external changes.

Firebase is changed first so a Firebase failure cannot leave RTDB advertising a completed lifecycle change. If the later RTDB write fails, Firebase disabled state is restored to its original value. Refresh-token revocation cannot be undone, but it does not alter credentials and the administrator receives a retryable error. Failed rollback is logged with UID and request identifier and surfaced as an explicit recovery-required response.

## Session revocation and audit

The dedicated session action calls Firebase Admin `revokeRefreshTokens(uid)`; it does not enumerate or delete sessions. Explicit confirmation is required, with a separate server check for self-revocation confirmation.

Successful deactivation, reactivation, and standalone revocation append `user.deactivated`, `user.reactivated`, and `user.session.revoked` through `recordAdministratorAudit(...)`. Snapshots contain only status, disabled-state, and coarse session-state information. Audit remains best-effort after the authoritative lifecycle operation.
