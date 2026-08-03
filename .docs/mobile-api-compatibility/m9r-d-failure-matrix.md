# M9R-D failure matrix

Simple transitions read Assignment, optionally read user, then issue one Assignment update. A failure before or during that update stops processing and creates no service-level compensation.

Finished executes sequentially: Assignment read, user read, cell, image, tower, user, Assignment, then achievement reads/transactions. Failure stops at that operation. Earlier successful writes remain. Failures after Assignment closure can return HTTP 500 even though the primary assignment is closed.

All failures preserve the legacy raw 500 envelope. No automatic recovery was added.
