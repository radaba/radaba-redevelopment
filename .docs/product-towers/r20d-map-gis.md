# R20D Tower Map & GIS View

## Route and authorization

`/home/towers/map` uses the same server-side active-user and exact Assignment-read privilege boundary as the Tower directory. Browsing is read-only; administrator privilege is required only for the pre-existing Add Tower action.

## Map library

The existing `maplibre-gl` 6.x dependency is reused. GeoJSON clustering groups nearby markers and expands clusters on zoom. The current privacy-safe style issues no external tile requests and requires no map API key.

## Data source and completeness

The existing `FirebaseTowerReadRepository.map()` reads `tower` ordered by Firebase push key with `limitToFirst(1001)`, renders at most the first 1,000 records, and marks the result bounded when another record exists. No unbounded Tower read, new API, index, path, or write is introduced. Filters can narrow this bounded window but cannot prove a complete production inventory.

## Coordinate handling

Coordinates are parsed for display only. Numbers and numeric strings are accepted when latitude is between -90 and 90 and longitude is between -180 and 180. Empty, null, absent, malformed, and out-of-range values remain unchanged in RTDB and are excluded from markers. The textual invalid list reports latitude missing, longitude missing, latitude invalid, longitude invalid, both invalid, or both coordinates missing.

## Filters and synchronization

Tower ID/site-name search plus proven region, sub-region, Tower/site type, operational status, coordinate availability, and GSM/UMTS/LTE presence filters are supported. Existing broader directory filters remain available. Selecting a textual result focuses its marker and opens the popup; selecting a marker highlights and scrolls the matching result when practical.

## Network summary

GSM uses `g900` and `g1800`; UMTS uses `u850`, `u900`, and `u2100`; LTE uses `l850`, `l900`, `l1800`, `l2100`, and `l2300`. Finite non-negative integer numbers and numeric strings are summed. Zero is preserved as known zero. Null, absence, and empty values remain Unknown. Unsupported values are not coerced and no bands are inferred.

## Known limitations

- The map is bounded, not a complete GIS inventory.
- No external basemap tiles are used, so geographic context is intentionally minimal.
- Filtering is not a spatial query and there is no viewport-based RTDB index.
- Coordinate repair, marker dragging, geocoding, live tracking, routing, coverage prediction, archive, restore, and delete are not implemented.