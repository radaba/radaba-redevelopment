# Reference read contracts

`getUtility` performs one full `utility` query ordered by key. An empty snapshot
returns HTTP 200 with `data: "not found"`. The observable successful Android
shape is an array containing the first key-ordered child. Fields are returned
unchanged, including `app_url`, `app_version`, `banner`, `distance`,
`geolocation`, `force_update`, and `maintenance`.

Failures return HTTP 500 with the raw Firebase error message. The route has no
method guard, authentication, filtering, pagination, or cache. The legacy
handler attempts another response for every later child; App Router safely
returns the first observable response and does not reproduce the subsequent
headers-already-sent defect.
