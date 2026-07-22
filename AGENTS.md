# Radaba Development Instructions

## Project objective

Redevelop the existing Radaba web application incrementally using Next.js App Router while preserving compatibility with the existing Firebase Authentication, Firebase Realtime Database, Android application, user data, privilege data, and business rules.

## Current milestone

Login and authentication migration.

## Core rules

- Investigate before modifying files.
- Preserve existing production behavior.
- Keep changes small, focused, testable, and reversible.
- Do not perform unrelated refactoring.
- Do not introduce database migration.
- Do not add database fields unless explicitly approved.
- Do not expose credentials, tokens, passwords, private keys, environment values, or service-account files.

## Database compatibility

The existing Firebase Realtime Database is the source of truth.

Do not:

- rename existing fields
- remove existing fields
- change existing field types
- move database nodes
- normalize snake_case fields
- rewrite existing records
- add required fields
- change the query shape without approval

Existing paths that must remain compatible:

```text
user
privilege
