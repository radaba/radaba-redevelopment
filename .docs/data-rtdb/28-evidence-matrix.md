# Evidence matrix

| Question                                  | Answer                                          | Evidence                                     | Confidence |
| ----------------------------------------- | ----------------------------------------------- | -------------------------------------------- | ---------- |
| Tower path                                | `tower/{pushKey}`                               | `tower-repository.ts:4`; command repo        | Proven     |
| Assignment path/key                       | `assignment/{pushKey}`                          | `assignment-repository.ts:7`; reserve key    | Proven     |
| Cell path/key                             | `cell/{pushKey}`, child `rcell_id`              | mobile Cell repositories                     | Proven     |
| Image metadata                            | `image` aggregate and Cell/Tower dynamic fields | mobile/image and embedded-image repositories | Proven     |
| Report metadata                           | Assignment `report_name`, `report_url`          | finish/report repositories                   | Proven     |
| Direct Android RTDB                       | none; mobile API only                           | Android Investigation 3 and server routes    | Proven     |
| Tower source/current, Assignment snapshot | creation copies Tower                           | Assignment command service/repository        | Proven     |
| Null vs zero                              | storage preserves; finish collapses             | types; finish `Number(value                  |            | 0)` | Partially proven |
| Tower audit atomic                        | root transaction                                | Tower command repository                     | Proven     |
| Hard-delete proof                         | bounded/indirect dependencies                   | workspace/report repositories                | Unknown    |
| Archive field                             | none approved                                   | R20; operational `radaba_status`             | Unknown    |
| RTDB rules                                | absent from repo                                | repository config scan                       | Unknown    |
| Production quality                        | no data accessed                                | investigation safety boundary                | Unknown    |
