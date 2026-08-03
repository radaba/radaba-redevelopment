# Ranking

Ranking is deterministic: exact identifier 100, exact text/email/name 90, identifier prefix 80, text prefix 70, bounded contains 50. Query classification adds a small ordering boost for Assignment, Tower, Cell, email, or PDF-like patterns but never excludes fallback results. Ties sort by entity then Firebase key. Results are globally capped at 120 before cursor paging.
