# Rules and security

No `database.rules.json` or equivalent RTDB rules file is present. `firebase.json` references only `storage.rules`, which denies direct browser Storage access. Therefore RTDB rule posture and `.indexOn` declarations are Unknown.

Redevelopment RTDB access uses Admin SDK, bypassing rules. Server session/role/privilege checks are the enforcement boundary. Strict administrator checks protect Tower and admin mutations; Assignment/mobile routes use their respective session/security wrappers. The legacy repository contains embedded credential/config material; it was not used or copied. Production Firebase rules require separate authorized confirmation.
