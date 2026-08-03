# Environment separation

Redevelopment environment selection comes from environment variables for project ID, RTDB URL, bucket, and optional service-account JSON (`src/lib/firebase/admin.ts:6-23`). A local environment file and service-account file exist; neither was read. The legacy config supports development and commented production selections, and Android uses separate development/production Firebase configurations.

Risks: no RTDB emulator declaration/guard, configuration can select production, Admin credentials bypass rules, shared Android package ID, and legacy scripts may have environment defaults. No script, Firebase CLI, import, or network validation was run.
