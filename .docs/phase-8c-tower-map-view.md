# Phase 8C — Tower Map View

## Scope and route

Phase 8C adds the read-only `/home/towers/map` route and query-preserving List View / Map View controls. It uses existing Tower latitude/longitude fields and links marker details to `/home/towers/[towerKey]`. It adds no API, write method, schema/index change, Assignment query, coordinate correction, or Android change.

## Map library and basemap decision

The project already includes MapLibre GL 6, so no dependency was added. MapLibre performs client-side GeoJSON rendering, clustering, bounds fitting, navigation controls, popups, and reset behavior.

No external tile provider is configured in this phase. The canvas uses a local privacy-safe background style and makes no geographic tile requests. This avoids disclosing viewport/tile coordinates derived from operational Tower locations to an unapproved external host. OpenStreetMap was reviewed but not hard-coded for that reason. There is no paid provider or API key. A future external basemap requires explicit destination approval, usage-policy review, and a minimal CSP/domain review.

No application CSP currently exists, and Phase 8C adds no CSP directive or external origin.

## Authorization and data strategy

The server page repeats Tower authorization: revocation-checked session, existing exact `Active` user, and strict `true` current-role privilege at `/assignment`, with no `super_admin` bypass.

The existing Tower read repository now exposes a map read. It performs `orderByKey().limitToFirst(1001)`, uses the first 1,000 records, applies existing keyword and exact filters server-side within that bounded set, maps Tower DTOs, validates coordinates, and serializes only markers. The extra record detects the bound. No browser Firebase SDK read, raw snapshot, N+1 lookup, or Assignment query exists.

Because filters are applied inside the first bounded key window, a bound warning states that results may be incomplete and recommends narrowing criteria. The map never claims a global total.

## Marker contract and coordinates

Markers contain only `towerKey`, `towerId`, `siteName`, numeric `latitude` and `longitude`, `region`, `subRegion`, `kabupaten`, `cluster`, `siteType`, and `btsType`. Radio fields, additional raw fields, user data, and Assignment data are excluded.

Numeric and numeric-string coordinates are accepted. Missing, empty, nonnumeric, or out-of-range latitude/longitude values are excluded without correction or write. The summary reports valid mapped Towers, excluded invalid-coordinate records, and bounded records scanned.

## Filters and interaction

The map reuses `q`, `region`, `subRegion`, `province`, `kabupaten`, `cluster`, `siteType`, and `btsType`. URL state is shareable and preserved when switching views; list-only cursor/page state is removed.

MapLibre clusters overlapping markers. Clicking a cluster expands it. Clicking a marker opens a DOM-built popup containing the approved marker fields and a View Tower Details link. Popup content uses `textContent`, not HTML interpolation. Initial load fits valid markers, caps one-marker zoom, uses an Indonesia-centered fallback, and Reset View restores the fitted viewport.

## Responsive, accessibility, and performance

Desktop and mobile use a full-width map with a minimum 28rem mobile height and 34rem larger-screen height, stacked responsive filters, touch navigation controls, and contained popups. Loading, empty/filter-empty, server error, denied, and map-library failure states retain List View access.

The canvas is dynamically imported with SSR disabled; other content hydrates only for filters/view switching. Marker transformation is server-side and bounded. GeoJSON clustering avoids rendering hundreds of overlapping DOM markers. No tile bundle or dependency was added.

MapLibre canvas interaction has inherent keyboard/screen-reader limits. The page therefore supplies labelled summaries, textual states, semantic view switching, visible focus, and the complete List View as the non-map alternative. Marker and cluster pointer behavior is supplementary rather than the sole way to access Tower records.

## Non-goals and readiness

Non-goals include Tower/Assignment mutation, coordinate editing or dragging, geofencing, routing, tracking, heatmaps, polygons, offline/external tiles, new indexes, migrations, and Android changes.

Automated readiness requires Phase 8C fixtures/tests, lint, all existing regression suites, TypeScript, and production build. Production readiness additionally requires authenticated browser checks for responsive MapLibre rendering, pointer/touch interaction, filtering, navigation, and representative operational coordinates.
