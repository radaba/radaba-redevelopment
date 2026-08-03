# M9R-D RTDB path audit

Allowed lifecycle paths are `assignment`, `cell`, `image`, `tower`, `user`, and `achievement`. Simple transitions use only `assignment` plus a read-only user lookup. Finished uses all six.

No Auth, Storage, log, metric, migration, or repair-marker path is accessed. Existing field names, types, node locations, query shapes, and push/transaction behavior remain unchanged.
