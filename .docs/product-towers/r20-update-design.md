# R20 Update Design

Existing administrator PATCH editing is retained unchanged by this investigation. A future R20-compliant update must add:

1. explicit reason validation;
2. an exact reviewed baseline of approved fields;
3. server re-read and compare inside the atomic Tower/audit transaction;
4. HTTP 409 on concurrent change;
5. current-value and changed-value UI guidance;
6. the warning that Assignment snapshots are not synchronized;
7. integration into the live R15C Tower workspace and list actions.

Do not add `updated_at` or version casually. Exact field comparison is preferred until a schema field is approved. Only changed approved fields may be written, and `tower_id` remains immutable.
