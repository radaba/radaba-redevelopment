# Image read contracts

`getImageDetails` reads `image` by exact `assignment_id` equality and returns the
first snapshot child. Empty snapshots return a successful empty object. Field
names and runtime types are preserved, including nullable `image_status` and
numeric-looking strings such as `total_antenna`.

Unlike the assignment and AOR handlers, this legacy handler catches Firebase
failures and returns HTTP 500 with code `500`, message `failed`, and the raw
error message as `data`.

The AOR composite also reads `image` by the same query and selects its first
child, but leaves repository failures uncaught.
