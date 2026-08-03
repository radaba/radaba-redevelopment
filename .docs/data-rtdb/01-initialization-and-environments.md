# Initialization and environments

`src/lib/firebase/admin.ts:1-27` initializes one Admin app using `FIREBASE_SERVICE_ACCOUNT` when supplied, otherwise application/default credentials with environment-provided project, RTDB URL, and bucket. `getApps()` makes it process-singleton. Admin Database/Auth/Storage bypass client rules. `src/lib/firebase/client.ts:1-41` initializes the Web SDK and in-memory Firebase Auth only; it does not export Database.

The legacy backend initializes Admin Database from a selected service account and explicit database URL (`functions/util/admin.js:1-20`). Its config contains development values and commented production alternatives; values are intentionally redacted. No `connectDatabaseEmulator`, `FIREBASE_DATABASE_EMULATOR_HOST`, or RTDB emulator declaration was found. Environment selection is therefore configuration-dependent and lacks a repository-level emulator guard.
