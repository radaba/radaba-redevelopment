# RTDB path inventory

| Top-level path        | Nested pattern                      | Key type                      | Read by                | Written by                      | Deleted by           | Confidence |
| --------------------- | ----------------------------------- | ----------------------------- | ---------------------- | ------------------------------- | -------------------- | ---------- |
| `tower`               | `tower/{pushKey}`                   | push key                      | Tower/workspace/mobile | web admin/import; mobile finish | none found           | Proven     |
| `tower_audit`         | `tower_audit/{towerKey}/{auditKey}` | Tower key + push key          | Tower history          | Tower commands                  | none                 | Proven     |
| `assignment`          | `assignment/{pushKey}`              | push key                      | web/mobile/reports     | web create/workflow; mobile     | none                 | Proven     |
| `assignment_comment`  | `.../{assignmentKey}/{commentKey}`  | push keys                     | web/SSE                | web                             | web comment remove   | Proven     |
| `assignment_photo`    | `.../{assignmentKey}/{photoId}`     | assignment key + generated ID | web                    | web                             | web photo remove     | Proven     |
| `cell`                | `cell/{pushKey}`                    | push key                      | web/mobile             | mobile API                      | none                 | Proven     |
| `image`               | `image/{pushKey}`                   | push key                      | mobile                 | mobile API                      | none                 | Proven     |
| `user`                | `user/{pushKey}`                    | push key                      | auth/admin/mobile      | admin/mobile                    | no RTDB delete found | Proven     |
| `privilege`           | `privilege/{pushKey}`               | push key                      | auth/admin/mobile      | admin                           | none                 | Proven     |
| `log`                 | `log/{pushKey}`                     | push key                      | legacy/admin unknown   | mobile sign-in                  | none                 | Proven     |
| `utility`             | `utility/{key}`                     | unknown/reference key         | mobile                 | no current writer               | none                 | Proven     |
| `category`            | `category/assignment/{key}`         | reference key                 | Assignment/mobile      | no current writer               | none                 | Proven     |
| `achievement`         | productivity/rigger time buckets    | push child                    | reports/legacy         | mobile finish transactions      | none                 | Proven     |
| `administrator_audit` | `{auditPushKey}`                    | push key                      | admin audit            | admin commands, best effort     | none                 | Proven     |

Legacy constants additionally name `pre_process`, `rcell`, `file`, `test`, `off_day`, `rank`, `badspot`, `visit`, and `user_test` (`legacy functions/util/config.js:23-41`). They are compatibility/legacy candidates, not proven active redevelopment paths. The active count above is 14; a complete production inventory is not proven.
