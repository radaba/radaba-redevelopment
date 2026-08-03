# Phase 8D — Tower Create

## Scope

Phase 8D adds administrator-only Tower registration to the existing `/home/towers` module while preserving list, detail, search, filters, cursor pagination, map, and related Assignments. It introduces no edit, delete, bulk import, schema migration, or modification of existing Tower records.

## Investigated production contract

The operational `tower` collection contained 29 records during the bounded read-only audit. All had a `tower_id`, all IDs were uppercase, and no normalized duplicates were found. Twenty-eight records used Firebase push keys; one legacy child used another key shape. The application continues generating push keys and accepts the legacy key for reads.

Proven create fields are `tower_id`, `sitename`, `site_type`, `radaba_status`, `latitude`, `longitude`, `region`, `sub_region`, `province`, `kabupaten`, `kecamatan`, `new_cluster_name`, `bts_type`, `enodeb_id`, `ne_name`, `antenna_system`, `antenna_type`, `txrxmode`, `g900`, `g1800`, `u850`, `u900`, `u2100`, `l850`, `l900`, `l1800`, `l2100`, and `l2300`. A stored Google Maps URL and remarks were not observed and are intentionally omitted. Existing derived fields such as regional status composites are not generated because their business rules are unproven.

## Authorization and validation

Existing Tower GET routes and pages retain the Active strict `/assignment` read boundary. `POST /api/towers` independently requires the existing Active `super_admin` plus strict `/privilege` administrator boundary. UI visibility is not authorization.

New records require Tower ID, Site Name, Region, Cluster, Latitude, and Longitude. Tower IDs are trimmed and uppercased, text is bounded and trimmed, latitude must be -90 through 90, longitude -180 through 180, and optional radio counts must be numeric from 0 through 999. Unknown fields are rejected rather than persisted.

## Duplicate and write boundary

The repository reserves a normal `tower` push key, then performs one transaction on the existing `tower` collection. Inside the transaction it compares normalized exact `tower_id` values and either aborts with the existing child key or adds exactly one new child. This avoids a query-then-write duplicate race without adding a uniqueness node, index, deterministic key, or schema field. The tradeoff is a collection-level transaction; this is acceptable for the currently small 29-record master collection but should be revisited if volume or concurrent Tower writers grow materially.

Duplicate responses use HTTP 409 and provide only the existing push key needed for the safe “Open existing Tower” link. Validation uses HTTP 400; authorization and other errors remain sanitized.

## Interface

Authorized administrators see Add Tower in the existing compact header. Desktop uses a bounded modal and mobile uses the full viewport. The form is grouped into General, Location, Network, and Radio fieldsets with native required/range validation, server validation, pending protection, Escape/Cancel handling, safe errors, and direct navigation to the created detail.

The map exposes administrator-only location-picking mode. Selecting a point opens the list form with six-decimal latitude and longitude URL-prefilled; the server still revalidates both values.

## Tests and limitations

`tests/towers/phase-8d-create.test.js` covers normalization, required fields, coordinate/radio bounds, unsupported fields, administrator authorization, HTTP results, push-key generation, atomic duplicate prevention, responsive form semantics, cancel/duplicate recovery, map prefill, and preservation of read-only features.

Known limitations: no Tower edit/delete/import, no externally stored map URL, no remarks, no audit record because a Tower audit contract is unproven, and no persisted creation actor/timestamp because those fields do not exist in the Tower schema. Collection-level duplicate transactions should be reconsidered at larger scale.
