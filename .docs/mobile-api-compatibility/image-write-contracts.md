# Image write contract

`/api/mobile/updateImageDetails` has no method guard; Android uses PUT with JSON.
The entire body is returned and written unchanged, including unknown fields,
empty strings, null, zero, false, numeric strings, and arbitrary URLs. The body
`assignment_id` controls all reads; same-named query values are ignored.

If `tower_height` is absent, a missing Assignment does not prevent the image
upsert. If present, the first Assignment record supplies nine band counts and
identity; a missing Assignment throws before any image write. Image matches are
all updated; otherwise a push creates one row. Success is HTTP 200
`{code:200,message:"success",data:body}`. Image query/write errors become raw
message HTTP 500. No URL/content validation or ownership enforcement exists.
