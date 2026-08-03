# Secrets

Public Firebase client configuration is environment-specific but browser
visible. Firebase Admin credentials, private keys, tokens, deployment keys,
registry credentials and backup credentials are secrets.

GitHub deployment secrets belong to protected environments, not repository or
organization-wide plaintext files. Prefer workload identity; otherwise mount a
credential file or inject a service-account value at runtime. Never bake Admin
credentials into Docker layers or standalone archives.

The repository scanner checks tracked and non-ignored files for private keys,
service-account structures, common API/token shapes, committed env files and
sensitive filenames. It does not upload source. GitHub fork pull requests never
receive secrets.

A local ignored service-account.json currently exists in the project directory.
It was not opened or printed. Confirm its ownership, rotation and secure storage,
then remove it from the working directory through an approved credential
handling process.
