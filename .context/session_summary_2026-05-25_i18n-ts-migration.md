# Session: i18n JSON → TypeScript migration (discovery)

**Date:** 2026-05-25  
**Scope:** `fe-mycourse` only (no BE changes)

## Discovery findings

### Namespace inventory (7 top-level keys)

| Namespace | Purpose |
|-----------|---------|
| `home` | Legacy home / promo / search placeholders |
| `commonHeader` | Header title, menu a11y, browse categories |
| `commonFooter` | Footer brand, links, nav aria-labels |
| `auth` | Login/signup, validation keys, confirm/logout, errors |
| `homepage` | Marketing sections (hero, courses, webinar, CTA) |
| `dashboard` | Role dashboards + unauthorized (added in unstaged diff) |

ICU placeholders preserved: `{email}`, `{seconds}`, `{count}`.

### Code references

- **Only consumer of JSON:** `src/i18n/request.ts` — dynamic ``import(`../messages/${locale}.json`)``.
- **~25 files** use `useTranslations` / `getTranslations` — no namespace changes if object shape unchanged.
- **Zod:** `validation.email` etc. resolved via `useTranslations("auth")` — unchanged.

### Git history

Recent commits touching messages: language store sync (`417258c`), browse menu i18n (`31c7112`), dashboard keys in working tree (uncommitted).

### GitNexus (fe-mycourse)

- `query("messages translation getRequestConfig")` — `request.ts` listed in definitions; auth flows use translations indirectly.
- `impact(request.ts, upstream)` — **LOW risk**, 0 direct upstream callers (Next plugin entry only).

### Docs mismatches (pre-migration)

All `docs/*.md`, `README.md`, and `.context` entries reference `en.json` / `vi.json` and `messages/{locale}.json` in `request.ts`. Target: `en.ts`, `vi.ts`, `src/lib/i18n/load-messages.ts`.

### Locked file layout

```
src/messages/en.ts          # as const + export default
src/messages/vi.ts          # satisfies Messages
src/messages/types.ts       # export type Messages
src/lib/i18n/load-messages.ts
src/lib/i18n/index.ts
src/i18n/request.ts         # loadMessages(locale)
src/types/i18n.d.ts         # AppConfig.Messages augmentation
```

Delete after QA: `en.json`, `vi.json`.

---

## Completed (2026-05-25)

### Files changed

| Action | Path |
|--------|------|
| Added | `src/messages/en.ts`, `vi.ts`, `types.ts` |
| Added | `src/lib/i18n/load-messages.ts`, `index.ts` |
| Added | `src/types/i18n.d.ts` |
| Updated | `src/i18n/request.ts` |
| Deleted | `src/messages/en.json`, `vi.json` |
| Docs | `architecture.md`, `folder-structure.md`, `patterns.md`, `components.md`, `logic-flow.md`, `screens.md`, `deploy.md` |

### Verification (passed)

- `npm run lint` — OK
- `npm run lint:biome` — OK (3 pre-existing warnings in ui/)
- `npm run build` — OK

### Typed translation follow-ups

- `signup-content.tsx`, `register-form.tsx`: ICU params passed as `String(...)`
- `advanced-promo-section.tsx`: literal `t("promo.list.itemN")` instead of dynamic key
- `types.ts`: `DeepStringRecord` so `vi.ts` satisfies key shape without matching EN literal strings

### GitNexus

- `request.ts` upstream: **LOW** (0 direct callers)
- `npx gitnexus analyze --force` — 1,703 nodes | 3,524 edges | 87 flows
