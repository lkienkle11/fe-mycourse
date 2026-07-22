# Routing (`fe-mycourse`)

_Last audited: 2026-07-22 (unmounted account/forgot-password: keep route constants; comment Link/menu usage to block prefetch). Prior: OAuth COOP note; OAuth callback middleware bypass._

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

Root `/` automatically redirects to `/vi` (default locale) via `src/app/page.tsx`.

---

## Middleware: Locale Enforcement

`src/proxy.ts` exports the next-intl middleware that enforces locale prefixes on every request **except** locale-less OAuth callback routes.

> `src/proxy.ts` is the active locale proxy entry used in this project.

```ts
// src/proxy.ts
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    "/((?!api|trpc|_next|_vercel|auth/discord/callback|auth/x/callback|.*\\..*).*)",
  ],
};
```

**Why OAuth callbacks are excluded:** Discord and X redirect to `/auth/discord/callback` and `/auth/x/callback` (no locale prefix). Those pages live at `src/app/auth/*/callback/` — **outside** `[locale]/`. If the middleware runs on those paths, next-intl redirects to `/vi/auth/discord/callback` (or `/en/...`), which has no matching page → **404**, the popup never `postMessage`s to the opener, and closing the popup triggers “login cancelled”. Excluding these paths from the matcher keeps the callback URL stable and lets the relay close the popup and complete login.

**Redirect URIs must stay locale-less:** `NEXT_PUBLIC_DISCORD_CALLBACK_URL` and `NEXT_PUBLIC_X_CALLBACK_URL` must be `<origin>/auth/discord/callback` and `<origin>/auth/x/callback` — never `/vi/auth/...` or `/en/auth/...`. Same rule applies to backend `DISCORD_CALLBACK_URL` / `X_CALLBACK_URL` and provider developer portals.



---

## App Router Tree

```
/                       → src/app/page.tsx               redirect → /vi
/auth/discord/callback  → src/app/auth/discord/callback/page.tsx  Discord OAuth popup callback (locale-less, no prefix)
/auth/x/callback        → src/app/auth/x/callback/page.tsx  X OAuth popup callback (locale-less; retained, not wired to modal)
/[locale]/              → src/app/[locale]/layout.tsx     NextIntlClientProvider + AppProviders
/[locale]/              → src/app/[locale]/(web)/layout.tsx  Header + main + Footer
/[locale]/              → src/app/[locale]/(web)/page.tsx    HomePage
/[locale]/become-instructor → src/app/[locale]/(web)/become-instructor/page.tsx  BecomeInstructorPage
/[locale]/confirm-email → src/app/[locale]/(web)/confirm-email/page.tsx  Email confirm
/[locale]/logout        → src/app/[locale]/(web)/logout/page.tsx         Logout
/[locale]/admin         → src/app/[locale]/admin/layout.tsx   DashboardLayout (admin items)
/[locale]/admin         → src/app/[locale]/admin/page.tsx     AdminDashboardPage
/[locale]/instructor              → src/app/[locale]/instructor/layout.tsx
/[locale]/instructor              → src/app/[locale]/instructor/page.tsx
/[locale]/instructor/tickets      → InstructorTicketsPage
/[locale]/sysadmin      → src/app/[locale]/sysadmin/layout.tsx
/[locale]/sysadmin      → src/app/[locale]/sysadmin/page.tsx
/[locale]/admin/taxonomy/{levels,topics,outcomes,skills,tags}  → shared TaxonomyListPage
/[locale]/sysadmin/taxonomy/{levels,topics,outcomes,skills,tags}  → shared TaxonomyListPage
/[locale]/admin/instructors/{roster,approvals,profiles,expertise,tickets}  → shared instructor screens
/[locale]/sysadmin/instructors/{roster,approvals,profiles,expertise,tickets}  → same shared screens
/[locale]/* (unknown)     → not-found.tsx chain → NotFoundPage (see 404 section below)
/_not-found (global)      → src/app/not-found.tsx → NotFoundPage + explicit NextIntlClientProvider + AppProviders
```

### Route Groups

`(web)` is a [Next.js route group](https://nextjs.org/docs/app/building-your-application/routing/route-groups) — the parentheses mean it does NOT appear in the URL. It applies the web shell layout (Header/Footer) to all pages inside.

### Locale-less OAuth callbacks

`src/app/auth/discord/callback/page.tsx` and `src/app/auth/x/callback/page.tsx` live **outside** `[locale]/`, so they have no locale prefix. This keeps OAuth `redirect_uri` values stable and independent of the active locale. The next-intl middleware **must not** run on these paths (see matcher exclusions above); otherwise the provider redirect is rewritten to `/{locale}/auth/...` and the popup flow breaks.

**Copy language (intentional):** OAuth callback relay pages use **English-only** hardcoded strings (via `OAuthPopupCallbackRelay` — e.g. “Completing Discord sign-in…”, “Back to home”). They do **not** use `next-intl` / `auth.socialLogin.*`. This is the shared pattern for both Discord and X callbacks: the popup closes almost immediately after `postMessage`, so localized copy adds little UX value; keeping a single English fallback avoids wiring i18n on locale-less routes. **Login/signup modal**, toasts, and OAuth error codes remain fully localized (`en` / `vi`).

**Discord (wired to popup):** `redirect_uri` is `<origin>/auth/discord/callback`, built in `startDiscordLoginAction` from `NEXT_PUBLIC_DISCORD_CALLBACK_URL`. The page runs as a popup: it reads `code` / `state` / `error` from the query string, `postMessage`s them to `window.opener` (origin-scoped), and closes itself. The opener's `useDiscordLogin` listener (`DISCORD_OAUTH_MESSAGE_TYPE`) then completes login via `discordLoginAction`.

**X (retained, not on popup):** `redirect_uri` is `<origin>/auth/x/callback`, built in `startXLoginAction` from `NEXT_PUBLIC_X_CALLBACK_URL`. Same popup relay pattern via `useXLogin` (`X_OAUTH_MESSAGE_TYPE`) and `xLoginAction`.

**COOP / OAuth popup:** OAuth popup flows need the opener and popup to share a browsing context group. If Cloudflare (or another edge proxy) sets `Cross-Origin-Opener-Policy: same-origin` (or a restrictive variant) on the FE origin, `window.opener` may be null and focus/postMessage can break. Prefer omitting COOP on the marketing/auth origin, or use a popup-compatible value; verify at the proxy — FE app code does not set COOP today. See `docs/deploy.md`.

### Unmounted account / forgot-password paths (no app pages)

These path **constants and href helpers stay in the codebase** (`src/constants/route.ts`, `src/lib/navigation/routes.ts`) for later use. There is **no** matching `src/app/[locale]/…/page.tsx` yet:

| Path | Status |
|------|--------|
| `/forgot-password` | Constant + `forgotPasswordHref` kept. Login `Link` usage is **commented**; temporary non-navigating label until the page ships (no prefetch 404). |
| `/my-courses`, `/my-cart`, `/wishlist`, `/notifications`, `/account-settings` | Constants + href helpers kept. Live config in `HEADER_DROPDOWN_ACCOUNT_GROUPS_PENDING`; **not** spread into `HEADER_DROPDOWN_ITEMS` until pages exist (commented spread). |

Do not delete route/API constants or business code. Do not “fix” missing routes by silencing the console — temporarily comment (or `prefetch={false}` only where a Link must stay) the **usage** that would prefetch.

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
| `/auth/discord/callback?code=…&state=…` | `app/auth/discord/callback/page.tsx` | `DiscordOAuthCallbackPage` (locale-less, English-only) — `postMessage` `code`/`state`/`error` to `window.opener`, then `window.close()`; fallback copy + Back-to-home link when opened without an opener | ✅ Implemented |
| `/auth/x/callback?code=…&state=…` | `app/auth/x/callback/page.tsx` | `XOAuthCallbackPage` (locale-less, English-only, retained) — same relay pattern for X OAuth; not wired to login/signup popup | ✅ Implemented |
| `/vi/confirm-email?token=…` | `[locale]/(web)/confirm-email/page.tsx` | `ConfirmEmailContent` | ✅ Implemented |
| `/en/confirm-email?token=…` | same | same | ✅ Implemented |
| `/vi/logout` | `[locale]/(web)/logout/page.tsx` | `LogoutContent` | ✅ Implemented |
| `/en/logout` | same | same | ✅ Implemented |
| `/vi/admin` | `[locale]/admin/page.tsx` | `AdminDashboardPage` | ✅ Shell + placeholder |
| `/vi/instructor` | `[locale]/instructor/page.tsx` | `InstructorDashboardPage` | ✅ Shell + placeholder |
| `/vi/instructor/courses` | `[locale]/instructor/courses/page.tsx` | `InstructorCoursesPage` | ✅ Implemented |
| `/vi/instructor/courses/{courseId}/info` | `[locale]/instructor/courses/[courseId]/info/page.tsx` | `InstructorCourseEditorPage` (`tab="info"`) — basic info incl. `about_course` WYSIWYG; Snow tooltip **Edit**/**Remove** update full same-URL link runs across block gaps | ✅ Implemented |
| `/vi/instructor/courses/{courseId}/outline` | `[locale]/instructor/courses/[courseId]/outline/page.tsx` | `InstructorCourseEditorPage` (`tab="outline"`) | ✅ Implemented |
| `/vi/instructor/courses/{courseId}/collaborators` | `[locale]/instructor/courses/[courseId]/collaborators/page.tsx` | `InstructorCourseEditorPage` (`tab="collaborators"`) | ✅ Implemented |
| `/vi/instructor/courses/{courseId}/pricing` | `[locale]/instructor/courses/[courseId]/pricing/page.tsx` | `InstructorCourseEditorPage` (`tab="pricing"`) | ✅ Implemented |
| `/vi/instructor/courses/{courseId}/certificate` | `[locale]/instructor/courses/[courseId]/certificate/page.tsx` | `InstructorCourseEditorPage` (`tab="certificate"`) | ✅ Implemented |
| `/vi/instructor/courses/{courseId}/review-history` | `[locale]/instructor/courses/[courseId]/review-history/page.tsx` | `InstructorCourseEditorPage` (`tab="review-history"`) — paginated approve/reject cards; URL query `page`, `status` | ✅ Implemented |
| `/vi/instructor/tickets` | `[locale]/instructor/tickets/page.tsx` | `InstructorTicketsPage` | ✅ Implemented |
| `/vi/admin/courses` | `[locale]/admin/courses/page.tsx` | Redirect → `/admin/courses/all` | ✅ Implemented |
| `/vi/admin/courses/all` | `[locale]/admin/courses/all/page.tsx` | `CourseAdminAllPage` | ✅ Implemented |
| `/vi/admin/courses/reviewing` | `[locale]/admin/courses/reviewing/page.tsx` | `CourseReviewPage` (`scope="admin"`) | ✅ Implemented |
| `/vi/admin/courses/trash` | `[locale]/admin/courses/trash/page.tsx` | `CourseAdminTrashPage` | ✅ Implemented |
| `/vi/admin/instructors/{roster,approvals,expertise,tickets}` | `admin/instructors/*/page.tsx` | Shared instructor screens | ✅ Implemented |
| `/vi/admin/instructors/roster?portfolioId={userId}` | same (`InstructorRosterPage`) | Deep link — auto-opens profile modal when profile exists | ✅ Implemented |
| `/vi/admin/instructors/profiles` | `admin/instructors/profiles/page.tsx` | Redirect → roster (preserves `portfolioId`) | ✅ Implemented |
| `/vi/sysadmin/instructors/*` | `sysadmin/instructors/*/page.tsx` | Shared instructor screens | ✅ Implemented |
| `/vi/sysadmin/instructors/roster?portfolioId={userId}` | same | Same deep link as admin roster | ✅ Implemented |
| `/vi/sysadmin` | `[locale]/sysadmin/page.tsx` | `SysadminDashboardPage` | ✅ Shell + placeholder |
| `/vi/sysadmin/courses` | `[locale]/sysadmin/courses/page.tsx` | Redirect → `/sysadmin/courses/all` | ✅ Implemented |
| `/vi/sysadmin/courses/all` | `[locale]/sysadmin/courses/all/page.tsx` | `CourseAdminAllPage` | ✅ Implemented |
| `/vi/sysadmin/courses/reviewing` | `[locale]/sysadmin/courses/reviewing/page.tsx` | `CourseReviewPage` (`scope="sysadmin"`) | ✅ Implemented |
| `/vi/sysadmin/courses/reviewing/:courseId/preview` | `[locale]/sysadmin/courses/reviewing/.../preview/page.tsx` | `CourseReviewPreviewPage` (placeholder) | ✅ Implemented |
| `/vi/sysadmin/courses/trash` | `[locale]/sysadmin/courses/trash/page.tsx` | `CourseAdminTrashPage` | ✅ Implemented |
| `/vi/admin/taxonomy/levels` (and topics, outcomes, skills, tags) | `admin/taxonomy/*/page.tsx` | Shared `TaxonomyListPage` | ✅ Implemented |
| `/vi/sysadmin/taxonomy/*` | `sysadmin/taxonomy/*/page.tsx` | Shared `TaxonomyListPage` | ✅ Implemented |
| `/vi/this-route-does-not-exist` (any unknown path) | `not-found.tsx` chain | `NotFoundPage` | ✅ Implemented |
| `/vi/admin/users`, … | — | — | 🚧 Remaining placeholder nav links outside the implemented taxonomy, instructor, and course review surfaces |

---

## Route Classification

Temporary classification for app navigation:

- **Public routes (no login required):** `PUBLIC_ROUTES.home`, `PUBLIC_ROUTES.forgotPassword`, `PUBLIC_ROUTES.confirmEmail`, `PUBLIC_ROUTES.logout`, `PUBLIC_ROUTES.becomeInstructor` (page requires login at runtime — State A shows login CTA).
- **Private routes (login required):** all entries under `PRIVATE_ROUTES` (`admin`, `instructor`, `sysadmin`, `account` groups).
- **Resource routes (dynamic params `:param`):**
  - `PUBLIC_RESOURCE_ROUTES` for public dynamic routes.
  - `PRIVATE_RESOURCE_ROUTES` for authenticated dynamic routes.
  - Current private resource routes:
    - `PRIVATE_RESOURCE_ROUTES.instructor.courseEditor` (`/instructor/courses/:courseId/info`)
    - `PRIVATE_RESOURCE_ROUTES.instructor.courseEditorTab` (`/instructor/courses/:courseId/:tab`)

This classification is defined in `src/constants/route.ts` and used by shared menu/sidebar constants.

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
| `src/app/[locale]/admin/layout.tsx` | `RoleDashboardLayout` → `DashboardLayout` (`ADMIN_DASHBOARD_ITEMS`, `admin:modify` gate) + shared dashboard page header |
| `src/app/[locale]/instructor/layout.tsx` | `DashboardLayout` (`INSTRUCTOR_DASHBOARD_ITEMS`, `instructor:modify` OR `course_instructor:read` gate) + shared dashboard page header |
| `src/app/[locale]/sysadmin/layout.tsx` | `RoleDashboardLayout` → `DashboardLayout` (`SYSADMIN_DASHBOARD_ITEMS`, `sysadmin:modify` gate) + shared dashboard page header |

Dashboard routes now share one page-header system in the shell:

- Static title/description metadata lives in `src/constants/dashboard/page-header.ts`.
- Breadcrumb labels/links are auto-derived from the role sidebar nav tree (`*DASHBOARD_ITEMS`) by matching route hrefs.
- `DashboardLayout` resolves that metadata from the current pathname and the role nav tree.
- The resolver logic itself lives in `src/lib/navigation/dashboard-page-header.ts`.
- Client pages can override breadcrumb/title/description/actions through `useRegisterDashboardPageHeader` (`@/hooks/dashboard`) when the header depends on runtime data (for example instructor course editor tabs).

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

Use route constants from `src/constants/route.ts` plus helper builders in `src/lib/navigation/routes.ts`:

```ts
import { PRIVATE_RESOURCE_ROUTES, PRIVATE_ROUTES, PUBLIC_ROUTES } from "@/constants/route";
import {
  instructorCourseEditorHref,
  instructorCourseEditorTabHref,
  toPrivateRoute,
  toPrivateResourceRoute,
  toPublicRoute,
} from "@/lib/navigation/routes";

router.push(toPublicRoute(PUBLIC_ROUTES.home));
router.push(toPrivateRoute(PRIVATE_ROUTES.admin.courses));
router.push(instructorCourseEditorHref(courseId));
router.push(instructorCourseEditorTabHref(courseId, "outline"));
router.push(
  toPrivateResourceRoute(PRIVATE_RESOURCE_ROUTES.instructor.courseEditorTab, {
    courseId: String(courseId),
    tab: "certificate",
  }),
);
```

`src/constants/route.ts` is the single source for FE route values:
- `PUBLIC_ROUTES` (public/no-login)
- `PRIVATE_ROUTES` (private/login-required)
- `PUBLIC_RESOURCE_ROUTES` (public dynamic routes with `:param`)
- `PRIVATE_RESOURCE_ROUTES` (private dynamic routes with `:param`)

`src/lib/navigation/routes.ts` centralizes route builders/helpers:
- `toPublicRoute` / `toPrivateRoute`
- `toPublicResourceRoute` / `toPrivateResourceRoute`
- feature helpers like `instructorCourseEditorHref(courseId)` and `instructorCourseEditorTabHref(courseId, tab)`
- pre-built href constants like `homeHref`, `logoutHref`, `adminCoursesHref`

For reusable home navigation touchpoints (logo/title in header/dashboard), use `src/lib/navigation/home.ts`:

```ts
import { homeHref, navigateToHome } from "@/lib/navigation/home";
import { Link, useRouter } from "@/i18n/navigation";
```

---

## Adding a New Page

1. Create the directory under `src/app/[locale]/` in the appropriate route group/segment (`(web)`, `admin`, `instructor`, `sysadmin`, ...).
2. Add a `page.tsx` file — this becomes the route.
3. Prefer a shared screen under `src/screen/common/` when multiple roles share the same UI; keep role-specific screens only when behavior actually differs.
4. Import and render the shared or role-specific screen component from the route page.
5. Add or update the route value in `src/constants/route.ts` (`PUBLIC_ROUTES`, `PRIVATE_ROUTES`, `PUBLIC_RESOURCE_ROUTES`, `PRIVATE_RESOURCE_ROUTES`).
6. Add or reuse a builder/helper in `src/lib/navigation/routes.ts` instead of string interpolation in screens/components.
7. Update `docs/screens.md` and `docs/pages.md` with the new route entry.
8. If the screen has forms or API mutations, follow [`patterns.md` §6b](./patterns.md) for `errors.codes.*` (API) vs `*.validation.*` (client).

Example:

```
src/app/[locale]/admin/taxonomy/levels/page.tsx   → route: /vi/admin/taxonomy/levels
src/screen/common/taxonomy/taxonomy-list-page.tsx → TaxonomyListPage (shared CRUD UI imported directly by the route; `formDialogKey` remounts `TaxonomyFormDialog` on each create/edit open — no route change)

src/app/[locale]/admin/courses/page.tsx           → route: /vi/admin/courses
src/screen/common/course/course-review-page.tsx   → CourseReviewPage (shared by admin + sysadmin; `CourseAdminTableActionsMenu` + `DeferredDropdownMenuItem`)
```
