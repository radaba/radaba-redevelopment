# Threat model

Protected assets are Assignment lifecycle state, Cell/Sector data, image metadata, profiles, credentials, tokens, and object existence. Threats include anonymous calls, stolen/revoked tokens, inactive users, role forgery, request identity spoofing, cross-rigger/cross-Tower access, RTDB path injection, replay, partial writes, enumeration, and sensitive logs.

Controls: Firebase verification with revocation, exact profile resolution, active/role checks, route-specific ownership relationships, identifier rejection, object-existence hiding, safe errors, token-free login logging, refresh-token revocation on logout, and hashed structured audits whose failures cannot affect responses.

Residual risks: Android is not yet bearer-enabled; legacy/observe do not block; issued ID tokens remain usable until expiry unless each request checks revocation (M11R does); no rate limiter exists; replay/atomicity changes need client/schema decisions; console audit storage/retention is operationally undefined; Firebase rules and production telemetry are outside scope.