# Administration Privileges Redesign

## Scope and preserved contracts

`/home/admin/privileges` is redesigned as a responsive access-control center. It continues to read the existing push-key `privilege` collection and exact supported-role inventory. Records retain `privilege_id`, `page_name`, `path`, `category`, optional `parent`, and strict boolean role fields. The route, APIs, authorization, paths, role identifiers, Firebase schema, reads, writes, stale-value handling, and final-administrator safeguard are unchanged.

No stored description, system/custom flag, lifecycle status, timestamps, create, rename, delete, or separate detail flow exists. The UI does not invent them. The existing confirmed boolean toggle remains the only action and submits the unchanged role, enabled, and previous-value payload to the existing PATCH endpoint.

## Layout and grouping

- Compact header with Refresh and authoritative cards for existing record count, security-critical `/privilege` records, distinct stored categories, and roles with at least one strict `true` field.
- Existing `category` values are treated as modules. Each module uses a native collapsible `details` section with record and assigned-role statistics.
- A horizontal module navigator provides quick category filtering without changing the database query.
- Desktop shows a contained role-access matrix. Mobile uses complete cards with wrapping paths and practical role toggles; it never forces the desktop table across the page.

## Search and filters

URL-backed local search covers page name, path, privilege identifier, category, and parent. Filters use only derived existing data: module, whether any role is enabled, and whether the record is the administrator-access path. A selected `role` from the Roles page remains supported and is preserved when applying or clearing filters. Filtering causes no additional server or Firebase request.

## Protection presentation

The exact `/privilege` permission is labelled `Protected · Critical` because it gates administrator access. This is presentation only. The server remains authoritative and continues preventing removal of the final strict `super_admin` grant. All privileges are non-creatable, non-renamable, and non-deletable in the current product; no fake disabled actions are shown.

## Accessibility and states

The page provides semantic headings, native keyboard-expandable module sections, table headers, labelled filters and role toggles, `aria-live` result and mutation feedback, descriptive dialog relationships, initial dialog focus, Escape cancellation, visible focus rings, textual status meaning, minimum 44px controls, long-value wrapping, contained overflow, and reduced-motion loading.

A route-specific skeleton matches the KPI/filter/group structure. Existing denied and sanitized error states remain. Separate no-data and filtered-empty states provide safe recovery. Invalid selected-role parameters display a warning and fall back to all roles.

## Performance, tests, and limitations

The page reuses the existing server-provided privilege and role arrays, groups and filters them in memory, and updates local state after a successful existing mutation. It adds no N+1 reads, duplicate API requests, refetch loop, unbounded read, or Firebase index.

`tests/admin/privileges-redesign.test.js` covers authorization retention, KPIs, search, filters, category grouping, module statistics, desktop/mobile rendering, protected presentation, unchanged PATCH payload, keyboard dialog behavior, safe states, accessibility/overflow, and unchanged API surface.

Known limitations: categories are the only authoritative module names; descriptions and system/custom metadata are unavailable; role counts are derived from strict fields; there is no pagination because the proven collection contains 24 records and the existing architecture reads this small authorization collection completely; no create/rename/delete/detail workflow exists.
