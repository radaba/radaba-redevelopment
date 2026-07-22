# Radaba Decision Log

## DEC-001: Preserve the existing database contract

**Status:** Accepted

**Decision**

The new Radaba application will preserve the existing Firebase Realtime Database paths, field names, and field types.

**Reason**

- Existing production data already uses this structure.
- The Android application may depend on the same structure.
- Renaming fields creates unnecessary compatibility risk.

**Consequences**

- Existing snake_case fields remain unchanged.
- No automatic database normalization is allowed.
- New fields require separate approval.

---

## DEC-002: Use incremental migration

**Status:** Accepted

**Decision**

Radaba will be migrated module by module rather than through a single full rewrite.

**Reason**

- Reduces operational risk.
- Makes testing and rollback easier.
- Allows validation against the legacy application.

**Initial sequence**

1. Authentication
2. Login UI
3. Dashboard
4. Operational modules

---

## DEC-003: Start with login and authentication

**Status:** Accepted

**Decision**

The first redevelopment milestone is login and authentication.

**Reason**

- It is a contained workflow.
- It establishes the visual system.
- It can be validated independently.
- It does not require database migration.

---

## DEC-004: Preserve Firebase Authentication

**Status:** Accepted

**Decision**

Firebase Authentication remains the authentication provider.

**Reason**

- Existing users already authenticate through Firebase.
- Changing providers would introduce account migration risk.
- The Android application may use the same provider.

---

## DEC-005: Preserve Realtime Database

**Status:** Accepted

**Decision**

The authentication migration will continue using Firebase Realtime Database rather than replacing it with Firestore.

**Reason**

- Existing user and privilege records are stored in RTDB.
- The legacy application uses RTDB queries.
- Changing databases is outside the current milestone.

---

## DEC-006: Preserve successful redirect

**Status:** Accepted

**Decision**

Successful authentication continues to redirect to:

```text
/home/assignment
