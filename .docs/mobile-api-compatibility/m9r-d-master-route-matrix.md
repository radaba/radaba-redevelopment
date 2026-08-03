# M9R-D master route matrix

| Legacy route/branch | App Router disposition | Writes | Replay |
|---|---|---|---|
| updateAssignmentDetails: Paused | Exact | assignment | Last-write-wins |
| Rejected | Exact | assignment | Last-write-wins |
| Dropped | Exact | assignment | Last-write-wins |
| On Progress | Exact | assignment | Last-write-wins |
| Finished | Exact with documented platform limitation | cell, image, tower, user, assignment, achievement | Counter-incrementing |
| Accepted / Checkin / Go | Deferred by M9R-A safe stop | Unknown | Unknown |
| completed branch | Deferred; not requested | Unknown | Unknown |
| updateAssignmentToClosedByID | Deferred; no confirmed Android caller/DTO | Unknown | Unknown |

The executable source is `tests/fixtures/mobile-assignment-lifecycle-parity-fixtures.js`.
