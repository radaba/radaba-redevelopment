
---

## `.docs/feature-status.md`

```md
# Radaba Feature Status

## Status definitions

- `Existing`: available in the legacy application
- `Investigating`: behavior is being documented
- `Planned`: approved for future work
- `In Progress`: currently under implementation
- `Completed`: implemented and validated in the new project
- `Blocked`: cannot continue until a dependency or decision is resolved

## Current migration status

| Module | Legacy status | New project status | Notes |
|---|---|---|---|
| Firebase client initialization | Existing | Initial scaffold | Needs contract validation |
| Firebase Admin initialization | Existing server behavior | Planned | Required for server auth |
| Login API | Existing | Planned | Current next phase |
| Login UI | Existing | Planned | Implement after API |
| Password reset | Existing | Planned | Implement with auth API |
| Session cookie | Existing | Investigating | Cookie format/lifetime must be confirmed |
| User RTDB lookup | Existing | Investigating | Path confirmed as `user` |
| Privilege lookup | Existing | Investigating | Path confirmed as `privilege`; exact query pending |
| Redux user state | Existing | Planned | Add after server API |
| Redux Persist | Existing | Planned | Preserve user payload shape |
| Login route guard | Existing | Planned | Add after session helper |
| Logout | Existing | Planned | Later auth phase |
| Dashboard | Existing | Not started | Redirect target `/home/assignment` |
| Assignments | Existing | Not started | Future milestone |
| Sites | Existing | Not started | Future milestone |
| Tower Database | Existing | Not started | Future milestone |
| Parameters | Existing | Not started | Future milestone |
| Jobs | Existing | Not started | Future milestone |
| Reports | Existing | Not started | Future milestone |
| Antenna Report | Existing | Not started | Future milestone |
| Audit Logs | Existing | Not started | Future milestone |
| Log Changes | Existing | Not started | Future milestone |
| Users | Existing | Not started | Future milestone |
| Roles and Privileges | Existing | Not started | Future milestone |
| Menu Assignments | Existing | Not started | Future milestone |

## Current approved sequence

1. Document the legacy authentication contract.
2. Implement Firebase Admin server initialization.
3. Implement session helper.
4. Implement login API.
5. Implement password-reset API.
6. Validate server authentication.
7. Implement modern login UI.
8. Connect UI to the API.
9. Add Redux user state and persistence.
10. Add route protection.
11. Perform full login regression testing.
