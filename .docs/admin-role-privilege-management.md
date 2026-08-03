# Administrator Role and Privilege Management

## Existing contracts

`user` is a 547-record Firebase push-key collection. The push key is the administrative record identifier; stored `uid` and `email` are not RTDB keys. Exact status values are `Active` and `Not Active`. Existing user roles are `field_team`, `l0_rno`, `l1_rno`, `l2_rno`, `manager`, `project manager`, `project_admin`, and `super_admin`.

`privilege` is a 24-record Firebase push-key collection, not a role-keyed object. Each record contains `privilege_id`, `page_name`, `path`, `category`, optional `parent` and `icon`, and existing strict boolean role properties. Boolean role properties are `field_team`, `l0_rno`, `l1_rno`, `l2_rno`, `manager`, `project_admin`, `project_owner`, `super_admin`, and `web_admin`.

The session resolver reads the complete small privilege collection. Page access remains `record.path === requestedPath && record[user.role] === true`.

## Administrator rule

Administrator access requires all of:

```text
verified session user
user.role === "super_admin"
user.status case-insensitively equals "active"
an existing privilege record where:
  path === "/privilege"
  super_admin === true
```

Only a derived `isAdministrator` boolean crosses into the application shell. Every administrator page and API resolves and checks the verified session independently.

## Commands

Allowed commands update exactly one child:

```text
user/{pushKey}/role
user/{pushKey}/status
privilege/{pushKey}/{existingRole}
```

Role changes require a role already present in users or privilege fields. Status changes accept only `Active` and `Not Active`. Privilege changes accept strict booleans and only role fields already present on the target record. Clients send the previous value; stale records return `409`.

The sole active `super_admin` cannot be demoted or deactivated. The final strict `super_admin` access on `/privilege` cannot be removed. Checks run immediately before field-level writes. They are check-then-write operations, so concurrent administrators can still race; broader root transactions were not introduced because they would widen the write boundary.

## Role mismatches

`project manager` exists in user records but has no matching privilege boolean. `project_owner` and `web_admin` exist as privilege fields but currently have no users. The UI displays these facts and does not rename or normalize them.

The centralized contract in `.docs/role-privilege-contract.md` now makes this boundary explicit. Seven exact mapped roles are assignable. `project manager` is legacy read-only; `project_owner` and `web_admin` remain privilege-only and are excluded from user mutation selectors. Observed values remain available for list filtering and inventory display.

## Users list browsing

The canonical route is `/home/admin/users`. Its URL-driven read model supports keyword search across the existing name, email, UID, role, status, company, and region values; exact role, status, company, and region filters; deterministic sorting; and 25, 50, or 100 rows per page. The server reads the existing user and privilege collections once per request, derives the unchanged role inventory, and sends only the selected page to the browser.

Paging is intentionally an in-memory slice of the current RTDB collection read. It is not Firebase cursor pagination and introduces no indexes, schema fields, or query-shape migration. The `project manager` and privilege-role mismatch remains a known limitation.

## User detail

`/home/admin/users/{userPushKey}` directly reads one existing application profile and the privilege collection. It displays sanitized current and legacy fields plus strict effective privileges. When the profile has a usable UID, one optional Firebase Auth lookup supplies a bounded read-only metadata view; missing or failed lookups do not fail the page. Persistent account history remains unavailable. The page is read-only; existing list role/status commands remain the only user mutations.

## Audit and sessions

No audit data exists at the inspected audit/log-change paths, so Phase 6A creates no RTDB audit node. Commands emit only sanitized actor UID, target push key, field, and previous/new scalar values to application logs.

Status changes do not revoke existing Firebase sessions. The resolver re-reads the user on the next protected request, while explicit Firebase token revocation remains outside this milestone.

## Non-goals

No user creation/deletion, email/password/UID editing, role creation/rename/delete, schema migration, generic RTDB editor, session revocation, or audit node is introduced.
