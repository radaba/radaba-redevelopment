# Assignment status lifecycle

Canonical web states are `Open`, `Accepted`, `On Progress`, `Paused`, `Finished`, `Rejected`, and `Dropped` (`assignment-workflow.ts:4-18`). Stored `assignment_status` also uses `Open`, `Closed`, and `Completed`; terminal compatibility considers state, status, `completed`, and timestamps.

| Evidence                                       | Web classification         | Mobile classification  | Android effect    | Terminal                 |
| ---------------------------------------------- | -------------------------- | ---------------------- | ----------------- | ------------------------ |
| `Open`                                         | available                  | active                 | downloadable/open | No                       |
| `Accepted`                                     | accepted                   | active                 | accepted          | No                       |
| `On Progress`                                  | working                    | active                 | working/resumed   | No                       |
| `Paused`                                       | paused                     | paused                 | paused            | No                       |
| state `Finished` + status `Closed`/`Completed` | complete                   | finished               | finish response   | Yes                      |
| `Rejected` + `Closed`                          | rejected                   | rejected               | closed            | Yes                      |
| `Dropped` + `Closed`                           | dropped                    | dropped                | closed            | Yes                      |
| `Checkin`, `Go`                                | transition/action evidence | legacy action branches | Android action    | Not independently proven |

Revisit transactionally restores a completed Assignment to state `On Progress`, status `Open`, and `completed=false` while appending `revisit_history` (`firebase-assignment-command-repository.ts:120-153`).
