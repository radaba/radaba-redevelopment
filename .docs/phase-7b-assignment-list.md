# Phase 7B: Read-Only Assignment List

The `/home/assignment` server page resolves the authenticated user, enforces the exact Phase 7A `/assignment` role privilege, validates URL state, and invokes the server-only Firebase Assignment repository. Only normalized list items cross into `AssignmentPageClient`.

## URL contract

The list accepts `timeBasis`, `startDate`, `endDate`, `page`, and `pageSize`. The optional business filter uses exactly one of `status`, `region`, `sub_region`, `company`, or `rigger_name`. More than one filter category is rejected so the Phase 7A repository query shape remains unchanged. Dates use `YYYY-MM-DD`, pages are one-based, and page sizes are 10, 25, or 50.

## Presentation

Desktop uses a scrollable table with a sticky header. Mobile uses cards and does not horizontally scroll. Pagination reports only the current page result count. Create, Import, and Export are disabled Coming Soon controls. Loading, no-results, permission-denied, invalid-filter, and repository-error states are distinct.

The milestone introduces no RTDB write method, Assignment transition, database field, browser Firebase access, import/export workflow, or Android workflow.
