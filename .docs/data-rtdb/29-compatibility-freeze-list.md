# Compatibility freeze list

Frozen by Android: mobile route paths/methods/query/body names, `{code,message,data}` wrappers, Assignment state/status values, raw Assignment field spelling/types, radio fields, `rcell_id` formula, dynamic `foto_*_(name|url)` keys, and Storage `visit`/`report` conventions.

Frozen by web/historical data: top-level paths and push-key strategy; `tower_id`, `assignment_id`, `rcell_id`; composite `index_*` fields; report fields; user/privilege shapes; `tower_audit`; existing null/empty/string behavior.

Safe internal changes require unchanged observable queries/writes and characterization tests. Path moves, key normalization, field renames/type changes, uniqueness enforcement, archive/index nodes, and null normalization require migration/versioning plus Android/backend coordination.
