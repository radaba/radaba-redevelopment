# Retrieval and pagination

The repository reads the latest 200 central administrator events and at most 40 parent entities with 50 retained child events from each nested Assignment/Tower root. Results are merged and sorted by timestamp, source root, and event key. Load More uses a stable canonical-key cursor over the loaded snapshot.

Realtime Database cannot perform one global chronological query across these heterogeneous nested roots. Counts, filters, pagination, and export therefore describe only the bounded loaded result set. Partial root failures return available results with an explicit warning.