# Pages (`fe-mycourse`)

_Last audited: 2026-05-29 (taxonomy screen layer: common + admin/sysadmin wrappers)._

## Current pages

| URL | Route file | Screen / content | Status |
|-----|------------|------------------|--------|
| `/` | `src/app/page.tsx` | Redirect → `/vi` (default locale) | Implemented |
| `/{locale}` | `src/app/[locale]/(web)/page.tsx` | `HomePage` (`src/screen/common/home/page.tsx`) | Implemented |
| `/{locale}/confirm-email` | `src/app/[locale]/(web)/confirm-email/page.tsx` | `ConfirmEmailContent` → `confirmAction` | Implemented |
| `/{locale}/logout` | `src/app/[locale]/(web)/logout/page.tsx` | `LogoutContent` → `logoutAction` (+ cross-tab `broadcast:logout`) | Implemented |
| `/{locale}/admin` | `src/app/[locale]/admin/page.tsx` | `AdminDashboardPage` (placeholder dashboard) | Implemented |
| `/{locale}/instructor` | `src/app/[locale]/instructor/page.tsx` | `InstructorDashboardPage` (placeholder) | Implemented |
| `/{locale}/sysadmin` | `src/app/[locale]/sysadmin/page.tsx` | `SysadminDashboardPage` (placeholder) | Implemented |
| `/{locale}/admin/taxonomy/{resource}` | `src/app/[locale]/admin/taxonomy/*/page.tsx` | `AdminTaxonomy*Page` → `TaxonomyListPage` (`src/screen/common/taxonomy/`) — resource: levels, topics, outcomes, skills, tags | Implemented |
| `/{locale}/sysadmin/taxonomy/{resource}` | `src/app/[locale]/sysadmin/taxonomy/*/page.tsx` | `SysadminTaxonomy*Page` → same `TaxonomyListPage` (sysadmin menu) | Implemented |

## Layout chain

- `src/app/layout.tsx` — fonts, Sonner `<Toaster />`
- `src/app/[locale]/layout.tsx` — `NextIntlClientProvider`, `AppProviders`
- `src/app/[locale]/(web)/layout.tsx` — `Header`, `<main>`, `Footer` (web routes only)
- `src/app/[locale]/admin|instructor|sysadmin/layout.tsx` — `DashboardLayout` (no site footer)

## Auth UX (not dedicated login/signup pages)

| Flow | Where it lives |
|------|----------------|
| Login / Sign up | Modal only — `LoginSignupPopup` in `header.tsx` (`LoginContent` / `SignupContent`) |
| Email confirm | Dedicated page `/{locale}/confirm-email?token=…` |
| Logout | Dedicated page `/{locale}/logout` (also linked from user menu) |

`PUBLIC_ROUTES` (`src/constants/route.ts`): `home`, `confirmEmail`, `logout` — no `auth.login` / `auth.signup` route constants.

## Planned / not implemented

| URL | Notes |
|-----|-------|
| `/{locale}/auth/login` | Optional future page; today login is modal-based |
| `/{locale}/courses` | Marketing/courses listing (nav placeholders only) |
| Dedicated signup page | Not planned — `SignupContent` stays in `LoginSignupPopup` |
| Further `/{locale}/admin/*` beyond taxonomy | Placeholder sidebar links only (users, courses, …) |

See also [`screens.md`](./screens.md), [`router.md`](./router.md), [`taxonomy-admin.md`](./taxonomy-admin.md).
