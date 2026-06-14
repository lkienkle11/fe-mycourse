# Session Summary — register locale sync (close-out)

> Saved: 2026-06-14
> Project: fe-mycourse

## Overview

FE register/resend flows send `locale` from `useLocale()` so BE confirmation email matches UI language.

## Files changed

| Path | Change |
|------|--------|
| `src/api/callers/auth/auth.ts` | `RegisterPayload.locale` |
| `src/actions/auth/auth-client.ts` | signup payload `locale` |
| `src/components/common/auth-menu/auth/login-content.tsx` | resend uses `locale` |
| `docs/flow.md`, `docs/screens.md`, `docs/api-overview.md`, `docs/reusable-assets.md` | docs sync |

## Quality gates

| Command | Result |
|---------|--------|
| `npm run lint:biome` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS |
| `npm run quality:deps` | PASS |

## Manual verify

1. `/en` → signup → BE receives `locale: "en"`
2. `/vi` → signup → `locale: "vi"`
3. Login resend (4004) preserves current locale
