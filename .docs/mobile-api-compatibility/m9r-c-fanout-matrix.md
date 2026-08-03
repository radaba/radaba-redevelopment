# M9R-C Finished fan-out matrix

| Step | R/W | RTDB path | Operation/payload | Required | Failure |
|---|---|---|---|---|---|
| 1 | R | `assignment` | equality `assignment_id` | yes | HTTP 500 |
| 2 | R | `user` | equality stored `rigger_email` | only when email truthy | HTTP 500 |
| 3 | R/W | `cell` / `cell/<key>` | equality `rcell_id`; update all or push closure + ID | per computed sector | earlier fan-out retained; 500 |
| 4 | R/W | `image` / `image/<key>` | equality stored `assignment_id`; update closure | query required, matches optional | earlier writes retained; 500 |
| 5 | R/W | `tower` / `tower/<key>` | equality stored `tower_id`; update Radaba indexes | query required, matches optional | earlier writes retained; 500 |
| 6 | R/W | `user` / `user/<key>` | repeat email query; update eight status/index fields | only if initial user exists | earlier writes retained; 500 |
| 7 | W | `assignment/<first-key>` | update closure/report/index fields | yes | related writes retained; 500 |
| 8 | R/W | `achievement/productivity/<year>/<level>/<node>` | index query, push-key selection, transaction | yes after Assignment write | Assignment remains closed; 500 |
| 9 | R/W | `achievement/rigger/<yyyy mon>` | index query, push-key selection, transaction | yes after Assignment write | Assignment/other achievement writes remain; 500 |

Allowed write roots are exactly `cell`, `image`, `tower`, `user`, `assignment`,
and `achievement`. Auth, Storage, log, configuration, metrics-marker,
`assignments_by_closed_date`, and `/metrics` writes are forbidden for the
selected branch.

