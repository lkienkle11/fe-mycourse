# Pages (`fe-mycourse`)

_Last audited: 2026-05-15 (GitNexus + source scan)._


## Current pages
| URL | Route file | Screen component | Status |
|---|---|---|---|
| `/` | `src/app/page.tsx` | Redirect to `/vi` | Implemented |
| `/{locale}` | `src/app/[locale]/(web)/page.tsx` | `src/screen/common/home/page.tsx` (`HomePage`) | Implemented |

## Layout chain
- `src/app/layout.tsx`
- `src/app/[locale]/layout.tsx`
- `src/app/[locale]/(web)/layout.tsx`

## Planned pages
| URL | Notes |
|---|---|
| `/{locale}/auth/login` | Planned route, currently auth is modal-based |
| `/{locale}/confirm-email` | Email confirmation (`src/app/[locale]/(web)/confirm-email/page.tsx`) |
| Signup UI | Modal-only (`SignupContent` in `LoginSignupPopup`), not a dedicated page |
| `/{locale}/admin/*` | Planned |
| `/{locale}/instructor/*` | Planned |
