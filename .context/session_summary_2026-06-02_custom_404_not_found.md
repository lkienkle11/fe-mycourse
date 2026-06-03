# Session Summary — Custom 404 Not Found Page

**Date:** 2026-06-02  
**Branch:** `fix/auth-submit-loading-spinner`  
**Task:** Custom localized 404 page per `temporary-docs/tieu-chuan-check-be-fe/fe-mycourse.md`

---

## What was done

### Giai đoạn 1 — Discovery
- Read latest `.context/session_summary_2026-06-02_auth_submit_spinner.md`
- Reviewed docs: `router.md`, `folder-structure.md`, `pages.md`, `reusable-assets.md`, `quality.md`, `screens.md`
- Confirmed reuse targets: `Button`, `Link`, `homeHref`, `AppProviders`, `Header`
- Git audit: clean tree except untracked `thumbnail-page-not-found.png`
- GitNexus: `query` (not found routing), `context` (LocaleLayout, AppProviders), `impact` (LOW risk)

### Giai đoạn 2 — Implementation
- **i18n:** `notFound` namespace in `src/messages/en.ts` + `vi.ts` (`metaTitle`, `title`, `descriptionLine1/2`, `backToHome`, `imageAlt`)
- **Screen:** `src/screen/common/not-found/not-found-page.tsx` — `NotFoundPage` with optional `showHeader`
- **Routes:**
  - `src/app/[locale]/not-found.tsx` — inherits `[locale]/layout` providers
  - `src/app/[locale]/(web)/not-found.tsx` — `showHeader={false}` (web layout has Header/Footer)
  - `src/app/not-found.tsx` — global fallback; inline `NextIntlClientProvider` + existing `AppProviders` (no new provider module)
- **Barrel:** export from `src/screen/common/not-found/index.ts` + `src/screen/common/index.ts`

### Giai đoạn 3 — Quality + Docs
- Quality: `lint:biome`, `lint`, `build`, `quality:deps` — all pass
- Docs updated: `pages.md`, `router.md`, `folder-structure.md`, `screens.md`, `reusable-assets.md`
- GitNexus close-out: `detect_changes`, `analyze`

---

## Architecture decisions

| Decision | Rationale |
|----------|-----------|
| Reuse `AppProviders` from `app-providers.tsx` | Header auth (`useGetMe`) needs `MeSwrSync` inside existing provider stack |
| Global `app/not-found.tsx` passes `locale` + `messages` explicitly | Outside `[locale]/layout` — NextIntl cannot infer locale |
| No new `AppIntlProviders` wrapper | Violates reuse-first rule; duplicate of `[locale]/layout.tsx` pattern |
| `showHeader={false}` on `(web)/not-found` | Avoid duplicate Header from `(web)/layout.tsx` |

---

## Manual test checklist

- [ ] `/vi/this-route-does-not-exist` — Vietnamese copy, Header loads auth, CTA → home
- [ ] `/en/this-route-does-not-exist` — English copy, same behavior
- [ ] Unknown admin path e.g. `/vi/admin/unknown` — 404 with dashboard or locale shell as appropriate

---

## Files touched

```
src/messages/en.ts
src/messages/vi.ts
src/screen/common/not-found/not-found-page.tsx
src/screen/common/not-found/index.ts
src/screen/common/index.ts
src/app/[locale]/not-found.tsx
src/app/[locale]/(web)/not-found.tsx
src/app/not-found.tsx
public/assets/images/common/thumbnail-page-not-found.png
docs/pages.md
docs/router.md
docs/folder-structure.md
docs/screens.md
docs/reusable-assets.md
```

---

## Not committed

User did not request commit. Branch still has untracked PNG + modified/new source/docs files.
