# R20 Archive Policy

Archive is not implemented because no Tower lifecycle field/value convention exists.

`radaba_status` cannot be used: mobile Finished sets it to `Yes` as an operational Radaba flag. Reusing it would change mobile and reporting semantics.

Before archive can be implemented, approve:

- exact legacy-compatible field name and value type;
- Active/Archived values and default for missing legacy records;
- list, map, lookup, Assignment creation, and mobile visibility behavior;
- whether active Assignments block archive;
- restore behavior;
- audit action/source/reason shape;
- migration-free handling of existing records.

Until then, no Archive/Deactivate action should be shown.
