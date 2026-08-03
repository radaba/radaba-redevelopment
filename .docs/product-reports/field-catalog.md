# Field catalog

The executable catalog is `src/features/reports-center/reports-center.mjs`. It is the accepted field allowlist and maps labels to existing source names. Required keys cannot be removed. Sensitive email, phone, actor, identity, and report-URL fields require administrator field access.

Tower uses `site_id`; `radaba_status` is absent. AOR exports contain metadata and availability only, never PDF bytes or tokenized URLs. Passwords, tokens, credentials, arbitrary nested paths, and privilege payloads are not catalogued.
