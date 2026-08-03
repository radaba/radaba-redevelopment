# R15A embedded image contract

Images are dynamic `foto_*_name` / `foto_*_url` fields embedded in bounded
Tower/visit and Cell reads. They are not assumed to be standalone RTDB
records. The server read layer pairs supported `foto_` fields, retains
incomplete and unknown pairs, and reports `missing-name` or `missing-url`.
The normalized object is never persisted; no schema migration, image table,
image index node, mobile contract, or Android change is part of R15A.

Firebase Storage download URLs and tokens are sensitive. Full URLs must not
enter IDs, logs, analytics, diagnostics, or visible metadata. Rendering occurs
only after authorization and source-record lookup. Diagnostics expose only a
token-free storage host/object context.

Global RTDB image pagination is not efficient because image fields are
embedded and dynamic. R15A therefore uses bounded recent source-record reads.
Assignment-, Tower-, or date-scoped reads should be preferred as the dataset
grows. No image binary is read to count references.
