# Routing (`fe-mycourse`)

_Last audited: 2026-06-05 (course routes + shared review screen sync)._


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
/[locale]/admin         → src/app/[locale]/admin/layout.tsx   DashboardLayout (admin items)
/[locale]/admin         → src/app/[locale]/admin/page.tsx     AdminDashboardPage
/[locale]/instructor              → src/app/[locale]/instructor/layout.tsx
/[locale]/instructor              → src/app/[locale]/instructor/page.tsx
/[locale]/instructor/tickets      → InstructorTicketsPage
/[locale]/sysadmin      → src/app/[locale]/sysadmin/layout.tsx
/[locale]/sysadmin      → src/app/[locale]/sysadmin/page.tsx
/[locale]/admin/taxonomy/{levels,topics,outcomes,skills,tags}  → AdminTaxonomy*Page → TaxonomyListPage
/[locale]/sysadmin/taxonomy/{levels,topics,outcomes,skills,tags}  → SysadminTaxonomy*Page → TaxonomyListPage
/[locale]/admin/instructors/{roster,approvals,profiles,expertise,tickets}  → AdminInstructor*Page → shared instructor screens
/[locale]/sysadmin/instructors/{roster,approvals,profiles,expertise,tickets}  → SysadminInstructor*Page → same shared screens
/[locale]/* (unknown)     → not-found.tsx chain → NotFoundPage (see 404 section below)
/_not-found (global)      → src/app/not-found.tsx → NotFoundPage + explicit NextIntlClientProvider + AppProviders
```

### Route Groups

`(web)` is a [Next.js route group](https://nextjs.org/docs/app/building-your-application/routing/route-groups) — the parentheses mean it does NOT appear in the URL. It applies the web shell layout (Header/Footer) to all pages inside.

Role dashboards use **URL segments** (not route groups) with a dedicated `DashboardLayout` shell:

```
src/app/[locale]/
├── (web)/              # Public/marketing pages — Header + Footer layout
├── admin/              # Admin dashboard — DashboardLayout + ADMIN_DASHBOARD_ITEMS
├── instructor/         # Instructor dashboard — DashboardLayout + INSTRUCTOR_DASHBOARD_ITEMS
└── sysadmin/           # Sysadmin dashboard — DashboardLayout + SYSADMIN_DASHBOARD_ITEMS
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
| `/vi/admin` | `[locale]/admin/page.tsx` | `AdminDashboardPage` | ✅ Shell + placeholder |
| `/vi/instructor` | `[locale]/instructor/page.tsx` | `InstructorDashboardPage` | ✅ Shell + placeholder |
| `/vi/instructor/courses` | `[locale]/instructor/courses/page.tsx` | `InstructorCoursesPage` | ✅ Implemented |
| `/vi/instructor/courses/{courseId}` | `[locale]/instructor/courses/[courseId]/page.tsx` | `InstructorCourseEditorPage` | ✅ Implemented |
| `/vi/instructor/tickets` | `[locale]/instructor/tickets/page.tsx` | `InstructorTicketsPage` | ✅ Implemented |
| `/vi/admin/courses` | `[locale]/admin/courses/page.tsx` | `CourseReviewPage` (`scope="admin"`) | ✅ Implemented |
| `/vi/admin/instructors/{roster,approvals,profiles,expertise,tickets}` | `admin/instructors/*/page.tsx` | `AdminInstructor*Page` → shared screens | ✅ Implemented |
| `/vi/sysadmin/instructors/*` | `sysadmin/instructors/*/page.tsx` | `SysadminInstructor*Page` → shared screens | ✅ Implemented |
| `/vi/sysadmin` | `[locale]/sysadmin/page.tsx` | `SysadminDashboardPage` | ✅ Shell + placeholder |
| `/vi/sysadmin/courses` | `[locale]/sysadmin/courses/page.tsx` | `CourseReviewPage` (`scope="sysadmin"`) | ✅ Implemented |
| `/vi/courses` | — | — | 🚧 Planned |
| `/vi/admin/taxonomy/levels` (and topics, outcomes, skills, tags) | `admin/taxonomy/*/page.tsx` | `AdminTaxonomy*Page` → `TaxonomyListPage` | ✅ Implemented |
| `/vi/sysadmin/taxonomy/*` | `sysadmin/taxonomy/*/page.tsx` | `SysadminTaxonomy*Page` → `TaxonomyListPage` | ✅ Implemented |
| `/vi/this-route-does-not-exist` (any unknown path) | `not-found.tsx` chain | `NotFoundPage` | ✅ Implemented |
| `/vi/admin/users`, … | — | — | 🚧 Remaining placeholder nav links outside the implemented taxonomy, instructor, and course review surfaces |

---

## Layout Hierarchy

```
Root layout            (src/app/layout.tsx)
  └─ Locale layout     (src/app/[locale]/layout.tsx)
        ├─ Web layout  (src/app/[locale]/(web)/layout.tsx)
        │     └─ Page  (HomePage, confirm-email, logout)
        ├─ Admin layout (DashboardLayout + admin items)
        ├─ Instructor layout
        └─ Sysadmin layout
```

| Layout file | What it mounts |
|-------------|---------------|
| `src/app/layout.tsx` | Global fonts (Roboto, Gilroy, GeistMono as CSS vars), `<Toaster>` (Sonner) |
| `src/app/[locale]/layout.tsx` | `NextIntlClientProvider`, `AppProviders` (`SWRConfig`, `EventsStreamProvider`, `MeSwrSync`, `LanguageLocaleSync`, auth tab sync) |
| `src/app/[locale]/(web)/layout.tsx` | `Header`, `<main>` content area, `Footer` |
| `src/app/[locale]/admin/layout.tsx` | `DashboardLayout` (`ADMIN_DASHBOARD_ITEMS`, `admin:modify` gate) |
| `src/app/[locale]/instructor/layout.tsx` | `DashboardLayout` (`INSTRUCTOR_DASHBOARD_ITEMS`, `instructor:modify` OR `course_instructor:read` gate) |
| `src/app/[locale]/sysadmin/layout.tsx` | `DashboardLayout` (`SYSADMIN_DASHBOARD_ITEMS`, `sysadmin:modify` gate) |

---

## Custom 404 (not-found)

Next.js renders `not-found.tsx` when `notFound()` is called or no route matches.

| File | When it runs | Provider / chrome |
|------|--------------|-------------------|
| `src/app/not-found.tsx` | Global fallback for unmatched URLs (e.g. `/vi/unknown`) — **outside** `[locale]/layout` | Inline `NextIntlClientProvider` (`locale` + `messages` from server) + existing `AppProviders` (same stack as `[locale]/layout.tsx`) |
| `src/app/[locale]/not-found.tsx` | Locale segment 404 (e.g. invalid locale child, admin/instructor unknown paths) | Inherits `NextIntlClientProvider` + `AppProviders` from `[locale]/layout.tsx` |
| `src/app/[locale]/(web)/not-found.tsx` | Unknown paths under `(web)` route group | Inherits locale providers; `(web)/layout` supplies `Header` + `Footer` — screen uses `showHeader={false}` |

Screen: `src/screen/common/not-found/not-found-page.tsx` (`NotFoundPage`).

- i18n namespace: `notFound` in `src/messages/en.ts` / `vi.ts`
- CTA: `Button` + `Link` from `@/i18n/navigation` + `homeHref` from `@/lib/navigation/home`
- Illustration: `@public/assets/images/common/thumbnail-page-not-found.png`

Manual test URLs: `/vi/this-route-does-not-exist`, `/en/this-route-does-not-exist`.

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

For reusable home navigation touchpoints (logo/title in header/dashboard), use `src/lib/navigation/home.ts`:

```ts
import { homeHref, navigateToHome } from "@/lib/navigation/home";
import { Link, useRouter } from "@/i18n/navigation";
```

---

## Adding a New Page

1. Create the directory under `src/app/[locale]/(web)/` (or the appropriate route group).
2. Add a `page.tsx` file — this becomes the route.
3. Create a screen component in `src/screen/<role>/<feature>/page.tsx` for the page body (or reuse a shared screen under `src/screen/common/` when multiple roles share the same UI).
4. Import and render the screen component from the route page.
5. Add the path constant to `src/constants/route.ts`.
6. Update `docs/screens.md` with the new route entry.

Example:

```
src/app/[locale]/admin/taxonomy/levels/page.tsx   → route: /vi/admin/taxonomy/levels
src/screen/admin/taxonomy/levels/page.tsx         → AdminTaxonomyLevelsPage (wraps shared TaxonomyListPage)
src/screen/common/taxonomy/taxonomy-list-page.tsx → TaxonomyListPage (shared CRUD UI)

src/app/[locale]/admin/courses/page.tsx           → route: /vi/admin/courses
src/screen/common/course/course-review-page.tsx   → CourseReviewPage (shared by admin + sysadmin)
```
