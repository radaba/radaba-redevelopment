# Role and Privilege Contract

Authorization and storage continue to use exact role strings. No aliases, normalization, automatic migration, rename, merge, or deletion is introduced.

| Role | User records | Privilege field | Assignable | Privilege key | State |
| --- | --- | --- | --- | --- | --- |
| `field_team` | Yes | Yes | Yes | `field_team` | Current |
| `l0_rno` | Yes | Yes | Yes | `l0_rno` | Current |
| `l1_rno` | Yes | Yes | Yes | `l1_rno` | Current |
| `l2_rno` | Yes | Yes | Yes | `l2_rno` | Current |
| `manager` | Yes | Yes | Yes | `manager` | Current |
| `project_admin` | Yes | Yes | Yes | `project_admin` | Current |
| `super_admin` | Yes | Yes | Yes | `super_admin` | Current administrator role |
| `project manager` | Yes | No | No | None | Legacy read-only |
| `project_owner` | No | Yes | No | `project_owner` | Privilege-only |
| `web_admin` | No | Yes | No | `web_admin` | Privilege-only |

User role changes and invitations share the seven-role assignable list. Existing legacy, privilege-only, or unknown stored roles remain displayable but cannot be newly assigned. `project manager` is not mapped to `project_admin` because no production-compatible alias evidence exists.

Only strict boolean `true` at the exact mapped privilege property grants access. Missing properties, `false`, strings such as `"true"`, numeric `1`, unknown roles, and unmapped legacy roles do not grant access. Existing `super_admin` authorization and final-administrator protections are unchanged.

No data migration is required or provided. Successful changes continue to append `user.role.changed` with exact stored before/after strings; validation rejection occurs before mutation or audit.
