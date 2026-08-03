# Write ownership

| Path                  | Writers                                                                        | Operation                            |
| --------------------- | ------------------------------------------------------------------------------ | ------------------------------------ |
| `tower`               | strict-admin web create/edit/import; mobile finish                             | transaction or patch                 |
| `tower_audit`         | Tower command repository                                                       | atomic append with Tower             |
| `assignment`          | web create/import/workflow/revisit/checklist/report; mobile transitions/finish | set, root update, transaction, patch |
| `assignment_comment`  | authorized web                                                                 | transaction/create/update/remove     |
| `assignment_photo`    | authorized web                                                                 | transaction/create/remove            |
| `cell`                | Android through mobile API                                                     | equality-query update-all or push    |
| `image`               | Android through mobile API                                                     | equality-query update-all or push    |
| `user`                | admin/profile/mobile finish                                                    | field set or patch                   |
| `privilege`           | strict admin                                                                   | boolean field set                    |
| `log`                 | mobile sign-in                                                                 | push                                 |
| `achievement`         | mobile finish                                                                  | per-row transactions                 |
| `administrator_audit` | admin services                                                                 | separate push/set                    |

Null-removal is explicit only in selected Tower editing. Most `.update()` calls follow RTDB semantics where null deletes fields. Authorization is server-side because Admin SDK bypasses rules.
