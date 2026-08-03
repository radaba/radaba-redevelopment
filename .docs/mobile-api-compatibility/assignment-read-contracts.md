# Assignment read contracts

`getassignmentsById` accepts `assignment_id` from the query string and performs
`assignment.orderByChild("assignment_id").equalTo(value).once("value")`.
Missing input is passed through as `undefined`, matching the legacy handler.
The first snapshot child is returned in `{code:200,message:"success",data}`;
no child produces `data: {}`. Firebase failures are not normalized by this route.

`getAorSummaryById` reads assignment, cell, then image sequentially using the
same exact key. It returns `{}` unless all three snapshots contain children.
The assignment and image use their first child; all cell children are returned.
