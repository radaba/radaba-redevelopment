# Cell and sector read contracts

`getCellDetailsPerSector` accepts query `rcell_id`, reads
`cell.orderByChild("rcell_id").equalTo(value).once("value")`, and returns every
matching child in Firebase enumeration order. Duplicates are retained. Missing,
empty, malformed, and first repeated query values are passed through without
validation. Not found is HTTP 200 with `data: []`. Read failure is HTTP 500 with
the raw error message. The route has no method guard or authentication.

Records are returned unchanged. No route-specific mapper is required because
the legacy route pushes `child.val()` directly; the pass-through itself is the
authoritative mapping.
