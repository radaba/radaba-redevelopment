
---

## `.docs/project-context.md`

```md
# Radaba Project Context

## Product

Radaba is an engineering parameter maintenance and telecom site management platform.

The platform supports operational activities such as:

- assignments
- site management
- tower database
- parameter maintenance
- job execution
- reports
- antenna reports
- audit logs
- log changes
- users
- roles and privileges
- menu assignments

## Existing system

The legacy Radaba web application uses:

- Next.js 12.2
- React 18
- TypeScript
- Ant Design 4
- Tailwind CSS 3
- Redux Toolkit
- Redux Persist
- Firebase Authentication
- Firebase Realtime Database
- Firebase Functions
- Firebase Hosting

An Android application may use the same authentication and database data.

## Redevelopment objective

Create a modern Radaba web application using a current Next.js App Router architecture while preserving existing data contracts and application behavior.

The redevelopment will be incremental. Existing modules will be migrated one milestone at a time instead of rebuilding everything at once.

## Current milestone

Login and authentication migration.

## Current priorities

1. Preserve Firebase Authentication.
2. Preserve Realtime Database paths and fields.
3. Preserve compatibility with the existing Android application.
4. Recreate server-side authentication.
5. Build the modern login interface.
6. Add session protection.
7. Continue to the dashboard and operational modules.

## Existing authentication summary

The legacy flow:

1. User enters email and password.
2. Server authenticates through Firebase Authentication.
3. The server looks up the matching record from the RTDB `user` node.
4. Email matching uses lowercase behavior.
5. The server rejects a user whose status is `not active`, case-insensitive.
6. Privileges are loaded using the user's role from the `privilege` node.
7. The privilege payload is attached to the returned user session object.
8. A `__session` cookie is created.
9. Successful login redirects to `/home/assignment`.

## Compatibility requirements

Must remain unchanged:

- `user` RTDB node
- `privilege` RTDB node
- existing user field names
- existing user field types
- role-based privilege behavior
- status check semantics
- successful redirect destination
- cookie name
- Firebase Authentication provider
- reset-password behavior

## Out of scope for the current milestone

- dashboard development
- assignment module redevelopment
- site module redevelopment
- tower database redevelopment
- antenna report redevelopment
- log changes redevelopment
- database migration
- field renaming
- multi-tenant architecture
- Android application changes
- adding login audit columns
