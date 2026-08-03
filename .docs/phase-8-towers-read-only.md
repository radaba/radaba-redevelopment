# Phase 8 — Towers read-only directory

## Scope and status

Towers is a new page; no legacy Towers UI exists. This milestone adds read-only `/home/towers` and `/home/towers/[towerKey]` routes and read-only GET APIs. It performs no Firebase writes, schema changes, migrations, or index changes. Production readiness is conditional on authorized browser acceptance checks.

## Data contract and inspection

The source is the existing RTDB `tower` push-key collection used by Assignment creation lookups. A bounded operational inspection on 25 July 2026 returned 29 children; 28 keys matched Firebase push-key shape and one key was nonstandard. No duplicate `tower_id` appeared in that bounded sample, but uniqueness is not assumed.

Proven fields were `tower_id`, `sitename`, `site_type`, `latitude`, `longitude`, `region`, `sub_region`, `province`, `kabupaten`, `kecamatan`, `new_cluster_name`, `bts_type`, `antenna_system`, `antenna_type`, `g900`, `g1800`, `u900`, `u2100`, `l900`, `l1800`, `l2100`, `l2300`, `l850`, `u850`, `enodeb_id`, `ne_name`, `site_id`, `txrxmode`, `roh_cluster`, `radaba_status`, regional status/visited fields, and `visited`. Coordinates were numeric in the sample; `enodeb_id` varied between number and string. All fields remain optional in the mapper. Scalars are preserved and non-scalar/unproven values are not exposed.

The Firebase child key is the internal route identity; `tower_id` remains the displayed business identifier. The mapper never exposes a raw snapshot or raw JSON.

## Authorization

Pages and APIs repeat the Assignment boundary: a revocation-checked Firebase server session, an existing current user, exact `Active` status, and an exact `/assignment` privilege record whose current-role value is strictly `true`. `super_admin` has no bypass. Navigation uses the same effective boolean but is not the security boundary.

## Bounded query behavior

The default/maximum page sizes are 25 and 100. Stable traversal uses `orderByKey`, a cursor, and at most 500 scanned children per request. Exact Tower ID is attempted first through the already-proven `orderByChild("tower_id").equalTo(...)` index. The safe fallback scans one bounded server window and matches Tower ID, site name, and cluster case-insensitively. Filters for region, sub-region, province, kabupaten, cluster, site type, and BTS type are exact case-insensitive matches within that same bounded window.

This deliberately does not claim a global count or exhaustive multi-field result. Summary cards are labelled “Current bounded result.” RTDB cannot efficiently combine the requested partial multi-field search and filters without additional indexes or denormalization; neither is approved. Cursor-based Next and First-page controls are used instead of fake numeric random access. URL parameters preserve shareable search/filter/page-size/cursor state.

## UI, accessibility, and API

Desktop uses a contained sticky-header table; mobile uses Tower cards. Detail contains General Information, Administrative Location, Coordinates, Radio Configuration, Assignment Compatibility Information, and proven additional scalar metadata. Copy actions use the browser clipboard. Google Maps appears only for valid coordinate ranges.

The pages include semantic headings, labelled inputs, Enter-to-search, visible focus styles, live result announcements, table headings, descriptive links, minimum 44px controls, loading/error/empty/denied/not-found states, reduced-motion loading behavior, and wrapping for long values.

`GET /api/towers` accepts the documented URL contract and returns a sanitized bounded result. `GET /api/towers/[towerKey]` reads one direct child. Both independently authorize, return private no-store data, and use 400/401/403/404/sanitized 500 responses as applicable.

## Tests, limitations, and non-goals

Fixture-backed tests cover complete/sparse mapping, scalar preservation, coordinate variants, Firebase-key separation, URL validation, bounds/read-only source assertions, independent authorization, APIs, navigation, responsive content, filters, states, and detail sections. Tests do not connect to Firebase.

Non-goals are create/edit/delete/import, assignment counts, raw JSON, database/index changes, and a related Assignments tab. A future phase may perform a separately approved bounded query where `assignment.tower_id === tower.tower_id`.

## Phase 8B extension

Tower detail now includes up to 20 bounded related Assignments using exact `assignment.tower_id === tower.tower_id`. It reuses the Assignment mapper, terminal helper, authorization, repository, and push-key detail navigation. See `phase-8b-tower-related-assignments.md`.

## Phase 8C extension

The authorized `/home/towers/map` route adds a bounded, clustered MapLibre visualization using the existing Tower filters and coordinates. Marker payloads are minimal, invalid coordinates are excluded, and List/Map switching preserves supported URL state. See `phase-8c-tower-map-view.md`.
