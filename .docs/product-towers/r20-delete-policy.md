# R20 Safe Delete Policy

Hard delete is not implemented. Current data access cannot prove orphanhood.

Future hard delete must require:

- strict administrator authorization;
- exact Tower ID confirmation;
- required reason;
- Tower baseline unchanged;
- unique resolvable `tower_id`;
- complete dependency summary with no overflow or unknown state;
- zero active and historical Assignments, Cells, embedded/legacy/web images, reports, and unresolved references;
- the full dependency check repeated inside or immediately adjacent to the atomic delete/audit operation;
- deletion of only `tower/{towerKey}`;
- an append-only surviving audit event;
- no cascade and no Storage deletion.

Any dependency or uncertainty blocks delete. Current API exposes no DELETE method and the command repository exposes no remove operation.
