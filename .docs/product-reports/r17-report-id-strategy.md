# R17 report ID strategy

The report ID is the first 32 URL-safe base64 characters of SHA-256 over
`assignment NUL <assignment database key> NUL report_url`. It is deterministic,
collision-resistant for the dataset, and contains no URL, query string, or token. Detail lookup
recomputes IDs over a bounded authorized Assignment window.
