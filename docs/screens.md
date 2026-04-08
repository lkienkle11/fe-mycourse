# Screens & routes (fe)

Inventory of **App Router** routes, primary **screen** compositions, and major UI surfaces. Locale behavior follows **`next-intl`**: paths are prefixed with `/{locale}` (e.g. `/vi`, `/en`) because `localePrefix` is **`always`** (`src/i18n/routing.ts`).

## Route table

| URL pattern | Source | What the user sees |
|-------------|--------|---------------------|
| `/` | `src/app/page.tsx` | **Redirect** to default locale home (`vi`) via `src/i18n/navigation`. |
| `/{locale}` | `src/app/[locale]/(web)/page.tsx` | **Home** — renders `HomePage` from `src/screen/home/page.tsx`. |
| (nested under locale) | `src/app/[locale]/(web)/layout.tsx` | **Web shell** — site **Header** (logo, title, search, locale switcher, cart button, auth) and `<main>{children}</main>`. |

There are **no** dedicated `app/.../auth/login` or `app/.../auth/signup` route segments in the tree today. Constants in `src/constants/route.ts` define `PUBLIC_ROUTES.auth.login` and `.signup` for future or linking use; **authentication is presented as a modal** (`LoginSignupPopup`) from the header (`AuthLayout`).

## Layout hierarchy

1. **`src/app/layout.tsx`** (root) — HTML shell, font variables, **`sonner` Toaster**.
2. **`src/app/[locale]/layout.tsx`** — Validates locale, wraps children with **`NextIntlClientProvider`** and **`AppProviders`** (SWR defaults).
3. **`src/app/[locale]/(web)/layout.tsx`** — Server wrapper: resolves locale for header props, renders **Header** + **main**.

## Home screen (`HomePage`)

File: `src/screen/home/page.tsx` — async server component assembling marketing/landing sections:

| Block | Component | Role |
|-------|-------------|------|
| Hero | `HeroSection` | Primary intro / hero |
| Search | `SearchSection` | Search entry |
| Courses | `TopCoursesSection` | Featured courses |
| Promo | `AdvancedPromoSection` | Secondary promo |
| Trending | `TrendingCoursesSection` | Trending content |
| Webinars | `UpcomingWebinarsSection` | Upcoming sessions |
| Closing promo | `PromoSection` | Final promo strip |

All live under `src/components/home/`. Supporting pieces include **`CourseCard`** and other home-specific presentational components.

## Global chrome

- **Header** (`src/components/common/header/header.tsx`) — Server component: translations via `getTranslations("home")`, **SearchBar**, **LocaleSwitcher**, cart **Button**, **AuthLayout**.
- **Footer** — Available under `src/components/common/footer/` (include as needed on future layouts).
- **Auth menu** (`src/components/common/auth-menu/`) — **`AuthButton`**, **`LoginSignupPopup`**, **`LoginContent`**, **`SignupContent`**, **`UserMenu`**, optional social login component.

## Feature / demo components

- **`src/components/demo/register-form.tsx`** — Demo registration form (not necessarily wired to a dedicated route); useful for experimentation.

## Internationalization on screens

- Copy is loaded from **`src/messages/en.json`** and **`src/messages/vi.json`** per active locale.
- The **LocaleSwitcher** in the header toggles between locales while preserving navigation patterns from `src/i18n/navigation.ts`.

## GitNexus mapping

- **Ui** cluster: large share of `src/components/ui/*` and compositional home/header pieces.
- **Auth** cluster: auth menu components, form handlers, and server actions backing modal login/signup.
- **Api** cluster: hooks and callers backing **`UserMenu`** / **`useAuth`**, not a visible “screen” by itself.

For behavioral detail (login, `/me`, refresh), see **`docs/flow.md`**. For stack and folders, see **`docs/architecture.md`**.
