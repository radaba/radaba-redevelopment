# Phase 8B — Tower Related Assignments

## Scope

Phase 8B adds a read-only Related Assignments section to the existing Tower detail route. It uses the relationship `assignment.tower_id === tower.tower_id`, the existing Assignment list contract and mapper, the existing Assignment read repository, and the existing Assignment detail route. It adds no write, mutation API, schema field, migration, index, chart, map, or Android change.

## Authorization

Tower detail continues to require a revocation-checked server session, an existing current user with exact `Active` status, and a strict `true` privilege for the current role on path `/assignment`. There is no `super_admin` bypass. No browser Firebase read is introduced. An optional related-record API was not needed because the existing server detail route can perform the authorized read directly.

## Query and ordering

`FirebaseAssignmentReadRepository.findRecentByTowerId` queries the existing `assignment` path with `orderByChild("tower_id").equalTo(towerId).limitToLast(20)`. The default limit is 20 and the enforced maximum is 50. An empty Tower ID returns no rows without contacting the Assignment node.

The exact `tower_id` query is already proven by Assignment command conflict checks. Created/closed Tower ID composites also exist, but require a date range and therefore cannot provide an unrestricted recent relationship view. RTDB cannot combine exact Tower ID filtering with true newest-first created-time ordering under the currently proven indexes. The repository consequently takes the last bounded key-ordered matches and sorts only that bounded set by `created_datetime` descending, with the Firebase key descending as a stable tie-break. The result must not be interpreted as an authoritative history or total.

## Presentation and sparse data

The section labels its subtitle and summary as recent/bounded. Summary values are records shown, active records shown, terminal records shown, and latest available Assignment date. Terminal classification reuses `isTerminalAssignment` and the established states Finished, Rejected, and Dropped. No Tower component defines a separate terminal rule.

Desktop uses a contained table with Assignment ID, category, RNO, Rigger, coordinator, status, state, Assignment time, Finished time, and action. Mobile uses compact cards. View Assignment links to the existing push-key route `/home/assignment/[assignmentKey]`.

The existing Assignment mapper now includes the already-proven `tower_id`, `assignment_category`, `rno_name`, and `coordinator_name` fields in its list DTO. Missing and malformed scalar values continue to normalize safely to text or `null`; historical records are never rewritten. Missing Tower ID, no results, and sanitized query failure each render an explanatory state while retaining the Tower detail page.

## Performance, testing, and limitations

The feature performs one direct Tower child read and at most one bounded Assignment query, with no N+1 lookups, browser Firebase access, or full-node scan. Fixture-only tests cover sparse mapping, exact query shape, limits, ordering, no-write behavior, missing-ID query suppression, sanitized failure state, shared terminal classification, responsive presentation, bounded summaries, accessibility, and existing detail navigation.

Known limitation: the 20 displayed records are recent within the bounded key-selected result, not a guaranteed globally newest set. Authoritative counts, pagination/full history, date-range controls, related-record APIs, Assignment creation/reassignment/status actions, and new indexes remain future separately approved work.

Production readiness remains conditional on authenticated desktop/mobile browser acceptance checks.
