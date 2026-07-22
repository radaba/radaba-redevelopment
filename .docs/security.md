
---

## `.docs/security.md`

```md
# Radaba Security

## Scope

This document covers the initial authentication migration.

## Secrets

Never commit or expose:

- `.env.local`
- Firebase service-account JSON
- private keys
- client secrets
- passwords
- access tokens
- ID tokens
- session-cookie values
- Google application credentials

Do not place secret files under:

```text
public/
src/
