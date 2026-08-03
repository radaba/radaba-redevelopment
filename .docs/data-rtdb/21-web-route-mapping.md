# Web route mapping

| Web route                             | Read model     | RTDB paths                           | Mutations         | Bounds            | Authorization                         |
| ------------------------------------- | -------------- | ------------------------------------ | ----------------- | ----------------- | ------------------------------------- |
| `/home/assignment` and detail         | server         | assignment                           | API actions       | bounded list      | active `/assignment` privilege        |
| `/home/towers` and detail/map/history | server         | tower, assignment, cell, tower_audit | strict-admin APIs | bounded           | assignment privilege / admin mutation |
| `/home/cells` and detail              | server         | cell, tower                          | read-only         | 50/page           | assignment privilege                  |
| `/home/reports` and detail            | server         | assignment embedded report fields    | read-only         | 200 window/scoped | assignment privilege                  |
| `/home/profile`                       | session/server | user/Auth                            | profile API       | scoped            | authenticated                         |
| `/home/admin/*`                       | server         | user, privilege, administrator_audit | admin APIs        | mixed             | strict administrator                  |

There are no literal `/home/assignments` or `/home/towers/[towerId]` routes; implemented paths use singular `/home/assignment` and Tower push-key route parameter.
