# User and authorization model

Firebase Authentication identity is separate from `user/{pushKey}` profile data. Login resolves Auth identity, then queries `user.email`; RTDB stores `uid`, `email`, `name`, `role`, `status`, organization/region/profile fields and operational Radaba composites (`services/authentication/auth.ts:20-84`; `firebase-admin-data-repository.ts:29-46`).

Privileges are `privilege/{pushKey}` records with metadata (`path`, `category`, etc.) and dynamic boolean role fields (`firebase-admin-data-repository.ts:49-63`). Web mutations use server-resolved sessions. Mobile compatibility historically accepts relationship/identity parameters on some routes; security wrappers are therefore the compatibility enforcement boundary.
