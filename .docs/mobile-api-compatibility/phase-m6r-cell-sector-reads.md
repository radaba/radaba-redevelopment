# Phase M6R: Cell, sector, and support reads

M6R implements two deliberately bounded read-only routes:
`getCellDetailsPerSector` and `getUtility`. Two routes, rather than three to six,
were selected because every other candidate is either a write/side-effect route,
a complex Assignment queue, an unproven expansion endpoint, or an untracked
catalog source with uncertain deployment status.

The implementation adds one Cell repository operation (`findByRcellId`) and one
utility operation (`listByKey`), small query services, thin handlers, sanitized
goldens, ordered-operation fakes, shadow comparisons, error/empty/duplicate
coverage, and static no-write enforcement. It adds no mapper transformation:
both source routes return raw child values.

Performance is intentionally unchanged: sector lookup is one equality query;
utility is one unbounded key-ordered node read. No caching, indexing, or
request-local optimization was introduced. Both routes remain public and expose
raw Firebase errors. Rollback is removal of the two route directories and their
M6R-specific repository/service/test additions.
