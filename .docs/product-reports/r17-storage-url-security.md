# R17 Storage URL security

Full URLs remain server-derived and are rendered only after authorization for preview/download.
They are never displayed as metadata, exported, logged, audited, analyzed, or used as IDs.
The parser exposes only bucket, decoded object path, and filename and rejects non-HTTPS,
unexpected Firebase hosts, and non-`report/` PDF objects.
