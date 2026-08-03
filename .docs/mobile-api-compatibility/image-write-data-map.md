# Image write data map

Order:

1. Read `assignment`, `orderByChild("assignment_id").equalTo(body.assignment_id)`.
2. When `tower_height` exists, iterate bands `g900`, `g1800`, `u900`, `u2100`,
   `l900`, `l1800`, `l2100`, `l850`, `l2300` and sectors ascending.
3. For each derived `rcell_id`, read `cell` by exact equality; update every match
   or push `{tower_height,rcell_id}` when absent.
4. Read `image` by exact `assignment_id`; update every match or push the body.
5. Return the original body.

There is no transaction, multi-location update, timestamp, post-write read,
Assignment mutation, metrics write, generated response ID, or Storage call.
