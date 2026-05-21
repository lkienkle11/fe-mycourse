# Session: Full docs sync vs source (`fe-mycourse`)

**Date:** 2026-05-21

## Goal

Quét source ↔ docs: thêm thiếu, sửa sai, xóa phantom. GitNexus `analyze --force` trước khi cập nhật.

## GitNexus

- `npx gitnexus analyze --force` → **1570** symbols, **3189** edges, **69** flows
- `detect_changes(all)` → medium (18 files touched in working tree)

## Docs updated (all `_Last audited: 2026-05-21` where applicable)

| File | Main fixes |
|------|------------|
| `pages.md` | confirm-email + logout = **current**; PUBLIC_ROUTES shape |
| `router.md` | `/logout` route; AppProviders sync list |
| `screens.md` | AuthLayout vs LoginSignupPopup; API/register; i18n `commonHeader`; HEADER_DROPDOWN `value` |
| `components.md` | Footer `getTranslations`; auth pages; LocaleSwitcher `useCodeLabelLanguage`; mobile sidebar z-201 |
| `architecture.md` | register/confirm/logout actions; language store; GitNexus counts; API routes |
| `folder-structure.md` | actions, app routes, browse-menu, language paths |
| `flow.md` | `mutateMe()` after login |
| `logic-flow.md` | popup mount in header |
| `modules.md` | language in State |
| `patterns.md` | language store (already OK) |
| `reusable-assets.md` | PUBLIC_ROUTES, API logout, language hooks, BROWSE_MENU_ITEMS |
| `api-overview.md` | logout endpoint |
| `api-using.md` | register/confirm/logout constants |
| `deploy.md` | server action list |
| `dependencies.md` | Toaster in root layout |

## Global corrections applied

1. **`signupAction`** → document as **deprecated alias** of `registerAction`; API path is **`/auth/register`**
2. **`PUBLIC_ROUTES`** → `home`, `confirmEmail`, `logout` only (removed phantom `auth.login` / `auth.signup`)
3. **Auth UI** → `LoginSignupPopup` in `header.tsx`; `AuthLayout` uses `useGetMe()` only
4. **Post-login refresh** → `mutateMe()` not raw `useAuth().mutate()`
5. **Mobile sidebar** → portal right panel, not Sheet; z-200/201
6. **Language** → Zustand + hooks, no Context

## Phantom removed from docs

- Placeholder signup server action
- `API_PUBLIC_ROUTES.auth.signup`
- `PUBLIC_ROUTES.auth.*`
- AuthLayout owning LoginSignupPopup
- Footer `useTranslations` (client)
- Toaster in AppProviders

## Still intentional in docs

- Planned routes: `/auth/login` page, admin/instructor areas
- delivery/graphql|mqtt|long-polling: not implemented stubs

## Quality gate (unchanged)

- eslint, tsc, biome (3 pre-existing warnings), build: pass

## Manual doc review checklist

- [ ] Open `docs/screens.md` Header tree vs running app
- [ ] Confirm `docs/pages.md` lists logout + confirm-email as implemented
- [ ] Grep docs for `auth.signup` / `placeholder signup` — should only appear as deprecated notes
