# Security

Both page and API resolve the existing strict `super_admin` plus `/privilege` boundary before constructing the health service. The response is private and uncached. No system-health privilege or RTDB record was added.

Project identifiers, database URLs, bucket names, API keys, credentials, tokens, service-account data, filesystem paths, environment variable contents, object names, user details, and exception stacks are omitted. Build metadata is limited to safe versions, environment label, optional short build identifier, uptime, timezone, and runtime mode.

All checks are reads or in-process configuration evaluations. No Auth, RTDB, Storage, Notification, report, or operational write is performed.
