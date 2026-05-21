# Pages (`fe-mycourse`)

_Last audited: 2026-05-21 (full source vs docs sync)._


## Current pages

| URL | Route file | Screen / content | Status |
|-----|------------|------------------|--------|
| `/` | `src/app/page.tsx` | Redirect → `/vi` (default locale) | Implemented |
| `/{locale}` | `src/app/[locale]/(web)/page.tsx` | `HomePage` (`src/screen/common/home/page.tsx`) | Implemented |
| `/{locale}/confirm-email` | `src/app/[locale]/(web)/confirm-email/page.tsx` | `ConfirmEmailContent` → `confirmAction` | Implemented |
| `/{locale}/logout` | `src/app/[locale]/(web)/logout/page.tsx` | `LogoutContent` → `logoutAction` (+ cross-tab `broadcast:logout`) | Implemented |

## Layout chain

- `src/app/layout.tsx` — fonts, Sonner `<Toaster />`
- `src/app/[locale]/layout.tsx` — `NextIntlClientProvider`, `AppProviders`
- `src/app/[locale]/(web)/layout.tsx` — `Header`, `<main>`, `Footer`

## Auth UX (not dedicated login/signup pages)

| Flow | Where it lives |
|------|----------------|
| Login / Sign up | Modal only — `LoginSignupPopup` in `header.tsx` (`LoginContent` / `SignupContent`) |
| Email confirm | Dedicated page `/{locale}/confirm-email?token=…` |
| Logout | Dedicated page `/{locale}/logout` (also linked from user menu) |

`PUBLIC_ROUTES` (`src/constants/route.ts`): `home`, `confirmEmail`, `logout` — no `auth.login` / `auth.signup` route constants.

## Planned pages

| URL | Notes |
|-----|-------|
| `/{locale}/auth/login` | Optional future page; today login is modal-based |
| Dedicated signup page | Not planned — `SignupContent` stays in `LoginSignupPopup` |
| `/{locale}/admin/*` | Planned (`src/screen/admin/`) |
| `/{locale}/instructor/*` | Planned (`src/screen/instructor/`) |
