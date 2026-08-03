# User Invitation and Provisioning

Active `super_admin` users with strict `/privilege` access can provision users from `/home/admin/users`. The server validates existing role semantics, checks case-insensitive email uniqueness in both RTDB and Firebase Authentication, generates an undisclosed cryptographically random temporary password, creates the Firebase Authentication account, and then appends the existing-shape RTDB profile under `user/{generatedPushKey}` with status `Active`.

The profile uses only established fields: `uid`, `name`, `email`, `role`, `status`, `company`, `department`, `region`, and optional `phone`. No custom claims or schema fields are introduced. The temporary password is never returned, logged, audited, or displayed. The invitee uses the existing Forgot Password flow to establish a private password; login behavior is unchanged.

Initial roles come only from the centralized seven-role assignable contract. Legacy, privilege-only, malformed, and unknown roles are rejected before Auth or RTDB creation.

## Recovery and audit

Firebase Authentication must be created first because its UID is required by the profile. If RTDB persistence fails, the service immediately deletes the newly created Auth account. A successful cleanup returns a retryable error. If cleanup also fails, the administrator receives a partial-provisioning message containing the request identifier and a sanitized internal log records only UID and request identifier for manual recovery. No silent partial failure is permitted.

After both authoritative resources exist, the shared best-effort `recordAdministratorAudit(...)` infrastructure appends `user.invited`. Its before snapshot is empty and its after snapshot contains only safe profile fields. Audit failure follows the established policy and does not remove a successfully provisioned user.
