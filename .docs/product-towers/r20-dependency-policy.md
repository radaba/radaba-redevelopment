# R20 Dependency Policy

A delete eligibility result is authoritative only if every class is complete:

- all Assignments by exact `tower_id`;
- all Cells by direct `tower_id` and every related `assignment_id`;
- all Tower and Cell embedded image pairs;
- all legacy `image` records for every related Assignment;
- all `assignment_photo` records for every related Assignment key;
- all embedded report metadata and any future report index;
- duplicate/unresolved Tower-ID references.

Current repositories provide bounded operational cohorts, not complete absence proof. Hitting a bound, missing an index, query failure, duplicate Tower ID, malformed identity, or unresolved relationship must set dependency state to unknown and block hard delete.

A future summary must report counts plus overflow/unknown flags. A numeric zero without completeness evidence is not sufficient.
