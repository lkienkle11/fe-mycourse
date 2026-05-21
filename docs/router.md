# Routing (`fe-mycourse`)

_Last audited: 2026-05-21 (full source vs docs sync)._


How URL routing is structured in the Next.js App Router, including locale handling, route groups, and navigation conventions.

---

## Routing Technology

| Layer | Technology | File |
|-------|-----------|------|
| Framework | Next.js App Router (file-system routing) | `src/app/` |
| Locale routing | next-intl proxy middleware | `src/proxy.ts` |
| Locale config | `defineRouting` | `src/i18n/routing.ts` |
| Navigation helpers | next-intl typed wrappers | `src/i18n/navigation.ts` |

---

## Locale Configuration

```ts
// src/i18n/routing.ts
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "vi"],
  defaultLocale: "vi",
  localePrefix: "always",  // every URL has /en or /vi prefix
});
```

All URLs are prefixed with the locale:

| URL | Locale | Page |
|-----|--------|------|
| `/vi` | Vietnamese | Home |
| `/en` | English | Home |
| `/vi/courses` | Vietnamese | Courses (future) |

Root `/` automatically redirects to `/vi` (default locale) via `src/app/page.tsx`.

---

## Middleware: Locale Enforcement

`src/proxy.ts` exports the next-intl middleware that enforces locale prefixes on every request.

> `src/proxy.ts` is the active locale proxy entry used in this project.

```ts
// src/proxy.ts
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
```



---

## App Router Tree

```
/                       → src/app/page.tsx               redirect → /vi
/[locale]/              → src/app/[locale]/layout.tsx     NextIntlClientProvider + AppProviders
/[locale]/              → src/app/[locale]/(web)/layout.tsx  Header + main + Footer
/[locale]/              → src/app/[locale]/(web)/page.tsx    HomePage
/[locale]/confirm-email → src/app/[locale]/(web)/confirm-email/page.tsx  Email confirm
/[locale]/logout        → src/app/[locale]/(web)/logout/page.tsx         Logout
```

### Route Groups

`(web)` is a [Next.js route group](https://nextjs.org/docs/app/building-your-application/routing/route-groups) — the parentheses mean it does NOT appear in the URL. It applies the web shell layout (Header/Footer) to all pages inside.

Future admin or instructor routes can use separate route groups with their own layouts:

```
src/app/[locale]/
├── (web)/              # Public/marketing pages — Header + Footer layout
├── (admin)/            # Admin pages — Admin sidebar layout (future)
└── (instructor)/       # Instructor pages — Instructor dashboard layout (future)
```

---

## Current Routes

| URL | Component | Screen | Status |
|-----|-----------|--------|--------|
| `/vi` | `[locale]/(web)/page.tsx` | `HomePage` | ✅ Implemented |
| `/en` | `[locale]/(web)/page.tsx` | `HomePage` | ✅ Implemented |
| `/vi/confirm-email?token=…` | `[locale]/(web)/confirm-email/page.tsx` | `ConfirmEmailContent` | ✅ Implemented |
| `/en/confirm-email?token=…` | same | same | ✅ Implemented |
| `/vi/logout` | `[locale]/(web)/logout/page.tsx` | `LogoutContent` | ✅ Implemented |
| `/en/logout` | same | same | ✅ Implemented |
| `/vi/courses` | — | — | 🚧 Planned |
| `/vi/admin/*` | — | — | 🚧 Planned |
| `/vi/instructor/*` | — | — | 🚧 Planned |

---

## Layout Hierarchy

```
Root layout            (src/app/layout.tsx)
  └─ Locale layout     (src/app/[locale]/layout.tsx)
        └─ Web layout  (src/app/[locale]/(web)/layout.tsx)
              └─ Page  (src/app/[locale]/(web)/page.tsx → HomePage)
```

| Layout file | What it mounts |
|-------------|---------------|
| `src/app/layout.tsx` | Global fonts (Roboto, Gilroy, GeistMono as CSS vars), `<Toaster>` (Sonner) |
| `src/app/[locale]/layout.tsx` | `NextIntlClientProvider`, `AppProviders` (`SWRConfig`, `EventsStreamProvider`, `MeSwrSync`, `LanguageLocaleSync`, auth tab sync) |
| `src/app/[locale]/(web)/layout.tsx` | `Header`, `<main>` content area, `Footer` |

---

## Navigation Helpers

Always use the typed wrappers from `src/i18n/navigation.ts` instead of Next.js built-ins. They include the locale prefix automatically.

```ts
import { Link, redirect, useRouter, usePathname } from "@/i18n/navigation";

// Correct: /vi/courses → navigates with locale prefix
<Link href="/courses">Courses</Link>

// Wrong: /courses → missing locale prefix, breaks next-intl routing
import { Link } from "next/link";
<Link href="/courses">Courses</Link>
```

---

## Client-Side Route Constants

Use constants from `src/constants/route.ts` for all internal navigation paths:

```ts
import { PUBLIC_ROUTES } from "@/constants/route";
router.push(PUBLIC_ROUTES.home);
```

Never hard-code path strings in components.

---

## Adding a New Page

1. Create the directory under `src/app/[locale]/(web)/` (or the appropriate route group).
2. Add a `page.tsx` file — this becomes the route.
3. Create a screen component in `src/screen/<role>/<feature>/page.tsx` for the page body.
4. Import and render the screen component from the route page.
5. Add the path constant to `src/constants/route.ts`.
6. Update `docs/screens.md` with the new route entry.

Example:

```
src/app/[locale]/(web)/courses/page.tsx     → route: /vi/courses
src/screen/common/courses/page.tsx          → CoursesPage screen component
```
