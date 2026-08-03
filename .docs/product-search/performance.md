# Performance and future index

Independent authorized roots are read in parallel with `Promise.allSettled`; one failure returns safe partial results. Each root is capped at 200, normalized results at 120, palette output at 20, and page output at 25. No binaries, per-result enrichment, global root scans, or search audit writes occur.

This bounded strategy is intentionally incomplete for older records. A future reviewed milestone may add a compact denormalized search index maintained at source commit points. Do not add Algolia, Elasticsearch, Meilisearch, Typesense, or another external engine without approval.
