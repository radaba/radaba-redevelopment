# Data model

Ownership path: `notification_user/{userKey}/{notificationKey}` where `userKey` is the established RTDB `user` Firebase push key resolved from the verified session. Records contain type, category, concise title/message, recipient push key, optional actor/target identities, optional safe route, read/read_at, created_at, severity and operation_id. `notification_dedup/{deterministicKey}` reserves retry identity. No operational payloads, credentials or URLs are copied.
