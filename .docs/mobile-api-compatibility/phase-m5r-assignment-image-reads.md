# Phase M5R: Assignment and image read compatibility

M5R adds three Android-proven, read-only compatibility routes. The legacy
repository was inspected without modification. No database writes, schema
changes, authentication enforcement, deployment, Android cutover, package
changes, or operational Firebase tests are included.

## Implemented routes

| Route | Legacy nodes | Result behavior |
| --- | --- | --- |
| `getassignmentsById` | `assignment` | First exact `assignment_id` match; `{}` when absent; repository errors remain uncaught. |
| `getImageDetails` | `image` | First exact match; `{}` when absent; errors become HTTP 500 `{code:500,message:"failed",data:error.message}`. |
| `getAorSummaryById` | `assignment`, `cell`, `image` | Sequential reads; composite only when every node is non-empty; each cell returns `tower_height = antenna_height`. |

Every route preserves the legacy success envelope and any-method fallthrough.
Duplicate selection follows Firebase snapshot iteration order. Values are passed
through without coercing strings, numbers, booleans, nulls, or empty strings.

Queue/list routes remain deferred because their composite selection and
pagination-before-sort behavior requires a separate bounded phase.
