# Production monitoring

Implemented in-process counters cover request/status/route counts, latency count/total/max, 401, 403, replay signal, unhandled exception, compatibility/security modes, and instrumented RTDB counts. These counters require an approved external metrics exporter before multi-instance production use; no external dependency was added.

Recommended dashboards: request throughput and status; latency percentiles from the external sink; authentication/authorization failures; RTDB reads/writes and errors; replay detections; security/compatibility modes; `/live` and `/ready`; deployment version and cohort. Alerts need measured staging baselines, ownership, and paging policy before rollout.