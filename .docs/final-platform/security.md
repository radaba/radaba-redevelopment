# Security

Web APIs use verified session cookies and exact active-user privilege checks. Mobile protected routes resolve Bearer before the compatibility cookie, verify Firebase tokens with revocation, resolve exactly one active profile, and authorize by explicit role plus Assignment/Cell/image relationships. Request identity never grants access.

Identifier injection, raw provider errors, token/password login logs, and sensitive operational logging are blocked. Audit and request logs retain request/correlation IDs and hashed actors only. Existing `legacy-compatible` and `observe` modes cannot be retired without Android authentication telemetry and explicit approval; production enforcement remains guarded in current code.

Security operations: freeze rollout, retain sanitized correlation evidence, revoke affected identities through approved Firebase operations, never weaken ownership rules, and use the incident runbook.