# Administration Roles Redesign

## Scope

`/home/admin/roles` was redesigned as a compact, responsive inventory and privilege-entry surface. The route, server authorization, repository, API, Firebase queries, role identifiers, privilege paths, commands, and protection rules are unchanged.

## Proven data and non-goals

The list DTO contains only exact role identifier, user count, enabled-page count, administrator classification, and privilege-field presence. Role descriptions, status, created/updated timestamps, and a total available privilege count do not exist in this contract and are not displayed. There is no role creation, rename, edit, or deletion flow. The only existing role-level action remains navigation to the filtered Privileges page.

The repository derives the inventory from existing `user.role` values and strict boolean fields on the small `privilege` collection. Counts are produced by the existing collection reads and grouped in memory; the presentation introduces no per-role reads, client refetch loop, or Firebase access.

## Presentation

- Compact header with the established subtitle and Refresh action; no unsupported Add Role action.
- Authoritative cards for total observed roles, roles with users, protected administrator roles, and the sum of enabled strict privilege assignments.
- URL-backed keyword, centralized contract-classification, and enabled-privilege filters. Filtering is local over the server-provided inventory and performs no additional data read.
- Dense semantic desktop table with contained horizontal scrolling and complete mobile cards below `md`.
- Exact identifier is retained alongside the centralized human label when they differ. Long role names and descriptions wrap.
- Protected, legacy, privilege-only, and unknown roles have explicit textual indicators. Color is supplementary.
- The privilege matrix remains on `/home/admin/privileges`; the list shows only a concise enabled count and contract state.

## Preserved safeguards

Access still requires the existing revocation-aware Active `super_admin` session with strict `/privilege` authorization. Unauthenticated requests redirect to login and unauthorized requests use the existing denied state. The final active administrator and final administrator privilege protections remain enforced by server command policy. The UI neither performs mutations nor claims that its badges are authorization.

## States and accessibility

The redesign includes a route-specific structure-matching reduced-motion loading skeleton, no-role state, filtered-empty recovery, shared sanitized error state, and existing denied state. It uses semantic headings/table headers, labelled controls, an `aria-live` result announcement, descriptive privilege links, visible focus rings, practical 44px controls, text-based protection meaning, and contained overflow.

## Tests and limitations

`tests/admin/roles-redesign.test.js` covers authorization retention, exact classification, KPIs, search and filters, desktop/mobile layouts, empty/loading/error states, protected-role presentation, action retention, accessibility/overflow safeguards, absence of unsupported role actions, unchanged GET-only API, and retained server protections.

Known limitations are intentional: descriptions are contract-derived explanatory copy rather than stored metadata; role status and timestamps are unavailable; privilege coverage cannot show a denominator; counts reflect the existing complete collection reads; and role details/editing do not exist.
