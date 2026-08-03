# User Detail and Account History — Phases A and B

The authorized route `/home/admin/users/{userPushKey}` uses the existing RTDB push key and reads exactly `user/{userPushKey}` plus the small `privilege` collection. It does not scan users, query by UID, or change any record.

The page displays a sanitized application profile, clearly labelled legacy fields, current role/status, strict effective privilege values, and integrity warnings. `project manager` remains an unmapped user-only role; privilege-only roles and duplicate privilege records are not normalized. It also displays the exact stored role, mapped privilege key, and centralized contract state; legacy and unknown values remain readable without repair.

Current-administrator identification uses an exact non-empty stored UID match, then normalized email only as a documented fallback. Final-active-administrator protection remains enforced by existing commands at write time; the detail page does not scan all users to predict whether the target is the sole administrator.

Phase B optionally reads Firebase Authentication by a usable stored UID. The detail DTO includes only Auth UID, email, email verification, disabled state, creation time, last-sign-in time, and unique provider identifiers. Missing UID, missing Auth account, and lookup failure are represented as `no_uid`, `not_found`, and `unavailable`; none fail the application-profile page. RTDB/Auth UID or normalized-email differences produce warnings and never repair data.

Firebase creation and last-sign-in values are account metadata, not persistent application history. Persistent role history, status history, and administrative audit history do not exist, so the page states that limitation and does not fabricate events.

No creation, invitation, deletion, password, session, Auth-account write, custom-claim, role-model, privilege-model, or schema behavior is introduced.
