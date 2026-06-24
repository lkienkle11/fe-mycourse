# Session Summary — Remember-me refresh token TTL fix

**Date:** 2026-06-24

## TTL policy (BE `token_ttl.go`)

- `remember_me = false` or email confirm → **3 days** (fixed absolute expiry; refresh uses **remaining** lifetime)
- `remember_me = true` → **30 days** (sliding on refresh)

## FE solution — BE Set-Cookie only (no extra JSON fields)

API login/confirm/refresh JSON: **only** `access_token`, `refresh_token`, `session_id`.

FE BFF TTL sources (in order):
1. **BE `Set-Cookie` Max-Age** on `refresh_token` (parsed via `refreshMaxAgeFromBeSetCookie`)
2. **Fallback:** HttpOnly `auth_session_expires_at` — **absolute Unix expiry** from last successful Set-Cookie parse (remaining = `expires_at - now`, never re-extends non-remember sessions)

No hardcoded 3d/30d constants on FE.

## Key files

- `src/lib/utils/auth-session.ts` — `AUTH_SESSION_EXPIRES_AT_COOKIE`, `resolveRefreshMaxAgeFromBe`, `expiresAtFromMaxAge`
- `src/actions/auth/auth.ts` — login/confirm parse Set-Cookie from `loginService` / `confirmService`
