# M9R-C Finished write contract

Route: any method at `/api/mobile/updateAssignmentDetails`; Android uses PUT
with JSON. Identity/audit query parameters sent by Retrofit are ignored.

Body fields used: `assignment_id`, `assignment_state`, `image_status`,
`report_name`, and `report_url`. Android also sends ignored `tower_id`,
`rigger_email`, plural `images_status`, and `assignment_status`. Other unknown
fields are ignored by the Finished branch. Undefined object properties are
omitted by JSON serialization; null, false, zero, and empty strings otherwise
retain JavaScript/Firebase semantics.

Success and not-found use HTTP 200 `{code:200,message:"success",data:...}`.
Thrown JSON/Firebase/helper errors use HTTP 500
`{code:500,message:"failed",data:error.message}`.

The branch validates neither starting state nor already-finished status.
Missing/malformed related records are skipped or coerced by existing JavaScript
rules. It does not require Cells, images, user, report fields, or `image_status`.

App Router parses JSON through `Request.json()`. Unlike Pages API body
middleware, form encoding is not reconstructed. Framework HEAD body suppression
is irreducible. Otherwise the handler retains the route's any-method export and
legacy envelope/property order.

