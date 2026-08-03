# Recommended next milestones

| Priority | Milestone                                         | Value                         | Complexity | Behavior change | Coordination    |
| -------- | ------------------------------------------------- | ----------------------------- | ---------- | --------------- | --------------- |
| 1        | Sanitized RTDB export + schema profiler           | proves paths/types/duplicates | Medium     | No              | Firebase owner  |
| 2        | RTDB emulator and environment guard               | safe repeatable validation    | Medium     | No              | DevOps          |
| 3        | Query/index contract audit against deployed rules | performance/completeness      | Medium     | No initially    | Firebase owner  |
| 4        | Mobile/API integration characterization           | freezes Android contracts     | Large      | No              | Android/backend |
| 5        | Finish partial-state/replay tests                 | protects operational close    | Medium     | No              | backend         |
| 6        | Dependency reconciliation prototype, read-only    | evaluates safe archive/delete | Large      | No              | data owners     |
| 7        | Radio scalar/null validation decision             | prevents semantic corruption  | Medium     | Potential       | Android/product |
| 8        | Cell uniqueness/idempotency design                | prevents duplicates           | Large      | Yes/versioned   | Android/backend |
| 9        | Audit coverage and retention contract             | accountability                | Medium     | Potential       | security/data   |
| 10       | Archive policy and migration plan                 | lifecycle control             | Large      | Yes             | all clients     |

No implementation, schema, index, migration, archive, delete, or synchronization is authorized by this document.
