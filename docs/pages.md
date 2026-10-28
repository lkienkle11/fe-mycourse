# Pages & Routes

Routing, layouts, screens and shell UI of `fe-mycourse`. This is the **only** place with the route table, layout hierarchy, locale configuration and route constants. Feature rules (what a page does) live in [`FEATURES.md`](FEATURES.md); stack, directory map and conventions in [`ARCHITECTURE.md`](ARCHITECTURE.md); reusable components in [`SHARED.md`](SHARED.md).

Paths are always prefixed with the locale (`/vi`, `/en`) because `localePrefix` is `"always"`. For how a surface connects to the rest of the app, use GitNexus from the repo root: `npx gitnexus query -r fe-mycourse "web layout footer"` or `npx gitnexus context -r fe-mycourse Footer`.

## Routing Technology

| Layer | Technology | File |
|-------|-----------|------|
| Framework | Next.js App Router (file-system routing) | `src/app/` |
| Locale routing | next-intl proxy middleware plus the signed-in/guest `/{locale}` <-> `/{locale}/home` redirects | `src/proxy.ts` (not `middleware.ts`; keep that file in place) |
| Locale config | `defineRouting` | `src/i18n/routing.ts` |
| Navigation helpers | next-intl typed wrappers | `src/i18n/navigation.ts` |

## Locale Configuration

| Setting | Value | Source |
|---------|-------|--------|
| Supported locales | `["en", "vi"]` | `src/i18n/routing.ts` |
| Default locale | `vi` | `src/i18n/routing.ts` |
| Locale prefix | `always` (every URL has `/en` or `/vi`) | `src/i18n/routing.ts` |
| Proxy | `src/proxy.ts` | next-intl locale routing + home redirects |

`/` is redirected by the proxy to `/{locale}` (307; `/vi` by default). `src/app/page.tsx` (using `routing.defaultLocale` and the typed `redirect` from `src/i18n/navigation.ts`) is the fallback if the proxy does not run. A signed-in browser then takes a second hop to `/{locale}/home`. UI chrome locales stay `en`/`vi` only; stored content locales are free-form BCP47 on the BE write path (see `taxonomy-admin`).

## Middleware: locale enforcement and home redirects

`src/proxy.ts` wraps the next-intl middleware (`createMiddleware(routing)`). It enforces locale prefixes on every request **except** the locale-less OAuth callback routes and any path containing a dot (so `/robots.txt` and `/sitemap.xml` bypass it), and it applies two mutually exclusive redirects. Pure decisions live in `src/lib/navigation/signed-in-home-redirect.ts`; cookie names in `src/constants/auth-cookie.ts`.

- **Locale root with a session:** pathname exactly `/vi` or `/en` (optional trailing slash) and **both** `refresh_token` and `session_id` cookies present (presence only, the token is not validated) => `307` to `/{locale}/home` with `Cache-Control: private, no-store` and `Vary: Cookie` set on the redirect only (next-intl `Set-Cookie` copied). `/en/login` and every other path are untouched. Crawlers send no cookies, so they always receive the public home. `/` takes two hops.
- **Guests on `/{locale}/home`:** exactly `/vi/home` or `/en/home` (optional trailing slash) that lacks either cookie => `307` to `/{locale}` with the same headers, so a guest never sees a sign-in prompt at `/home` (`resolveGuestHomeRedirectPath({ pathname, hasSession })`).
- **No loop:** the rules are mutually exclusive (one needs both cookies, the other lacks one). A stale cookie pair still counts as a session, reaches `/{locale}/home`, which shows the shared `unauthorized` sign-in state (or a retryable `server-error`/`network` state while `/me` is failing) and never redirects back to `/`.
- **Dead session:** the presence check cannot tell a live cookie pair from a dead one. When the BE rejects a refresh with `401`/`403`, `POST /api/auth/refresh` (or the Server Action that refreshed) removes the cookies, so the next request for `/{locale}` is served the public home instead of being redirected. `src/proxy.ts` and the two redirect rules above are unchanged.

```ts
// src/proxy.ts (shape)
const intlMiddleware = createMiddleware(routing);
export default function proxy(request: NextRequest) {
  // locale-root + both auth cookies -> 307 /{locale}/home ; /{locale}/home without them -> 307 /{locale}
  // otherwise the next-intl response
}
export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|auth/discord/callback|auth/x/callback|.*\\..*).*)"],
};
```

**OAuth callbacks stay locale-less.** Discord and X redirect to `/auth/discord/callback` and `/auth/x/callback`. Those pages live outside `[locale]/`; if the proxy ran on them, next-intl would redirect to `/vi/auth/...` (no page => 404, the popup never `postMessage`s, closing it reads as "login cancelled"). So the matcher excludes them, and `NEXT_PUBLIC_DISCORD_CALLBACK_URL` / `NEXT_PUBLIC_X_CALLBACK_URL` (and BE `DISCORD_CALLBACK_URL` / `X_CALLBACK_URL`, and provider developer portals) must be `<origin>/auth/<provider>/callback`, never `/vi/auth/...`. Callback relay pages (`OAuthPopupCallbackRelay`) use **English-only** hardcoded copy on purpose (the popup closes right after `postMessage`; no `next-intl` on locale-less routes); the login/signup modal, toasts and OAuth error codes stay localized.

**COOP / OAuth popup:** the opener and popup must share a browsing context group. If Cloudflare (or another edge) sets `Cross-Origin-Opener-Policy: same-origin` (or a restrictive variant) on the FE origin, `window.opener` may be null and focus/`postMessage` break. Prefer omitting COOP on the marketing/auth origin or use a popup-compatible value; verify at the proxy (FE code sets none). See [`deploy.md`](deploy.md).

## Route table

Route files are relative to `src/app/[locale]/` unless they start with `src/`. `{a,b}` lists sibling files. Status is `Implemented` unless stated.

| URL | Route file | Screen / content |
|-----|-----------|------------------|
| `/` | `src/proxy.ts`, fallback `src/app/page.tsx` | Redirect to `/{locale}` (307); a signed-in browser then continues to `/{locale}/home` |
| `/robots.txt` | `src/app/robots.ts` | `buildRobotsTxtRules` (bypasses the proxy) |
| `/sitemap.xml` | `src/app/sitemap.ts` | `buildSitemapEntries` over the SEO-indexable pathnames (bypasses the proxy) |
| `/auth/discord/callback` | `src/app/auth/discord/callback/page.tsx` | `DiscordOAuthCallbackPage` (locale-less, English-only): posts `code`/`state`/`error` to `window.opener` (origin-scoped) then `window.close()`; fallback copy + Back-to-home link without an opener |
| `/auth/x/callback` | `src/app/auth/x/callback/page.tsx` | `XOAuthCallbackPage` (locale-less, English-only, retained, not wired to the popup) |
| `/{locale}` | `(web)/page.tsx` | `HomePage` guest home, indexable (see `home-and-catalog`) |
| `/{locale}/home` | `(web)/home/page.tsx` | `SignedInHomePage`, login-gated (`StatusErrorPage` `unauthorized`; `MeOutagePage` on a `/me` outage), `noindex,nofollow` |
| `/{locale}/courses/{slug}` | `(web)/courses/[slug]/page.tsx` | `CourseDetailPlaceholderPage` (temporary public "coming soon", no-index) - Placeholder |
| `/{locale}/login?next=...` | `(web)/login/page.tsx` | `LoginPageContent` full-page fallback; intercepted as a modal (`@modal/(.)login`) when navigated to in-app |
| `/{locale}/signup?next=...` | `(web)/signup/page.tsx` | `SignupPageContent` full-page fallback; intercepted as a modal (`@modal/(.)signup`) |
| `/{locale}/become-instructor` | `(web)/become-instructor/page.tsx` | `BecomeInstructorPage` (states A-H; state A is the shared `unauthorized` state, a `/me` outage shows `MeOutagePage`; see `instructor-application`) |
| `/{locale}/confirm-email?token=...` | `(web)/confirm-email/page.tsx` | `ConfirmEmailContent` -> `confirmAction` |
| `/{locale}/logout` | `(web)/logout/page.tsx` | `LogoutContent` -> `logoutAction` (+ cross-tab `broadcast:logout`) |
| (parallel slot, no URL) | `@modal/{default,page}.tsx`, `@modal/[...catchAll]/page.tsx`, `@modal/(.)login/page.tsx`, `@modal/(.)signup/page.tsx` | Modal slot, see "`@modal` parallel slot" |
| `/{locale}/admin` | `admin/page.tsx` | `AdminDashboardPage` (placeholder shell) |
| `/{locale}/admin/courses` | `admin/courses/page.tsx` | Redirect to `/admin/courses/all` |
| `/{locale}/admin/courses/{all,reviewing,trash}` | `admin/courses/{all,reviewing,trash}/page.tsx` | `CourseAdminAllPage`, `CourseReviewPage` (`scope="admin"`), `CourseAdminTrashPage` |
| `/{locale}/admin/instructors/{roster,approvals,expertise,tickets}` | `admin/instructors/{roster,approvals,expertise,tickets}/page.tsx` | Shared instructor screens; roster accepts `?portfolioId={userId}` (auto-opens the profile modal when it exists) |
| `/{locale}/admin/instructors/profiles` | `admin/instructors/profiles/page.tsx` | Redirect to roster (preserves `portfolioId`) |
| `/{locale}/admin/taxonomy/{levels,topics,outcomes,skills,tags}` | `admin/taxonomy/{levels,topics,outcomes,skills,tags}/page.tsx` | Shared `TaxonomyListPage` |
| `/{locale}/instructor` | `instructor/page.tsx` | `InstructorDashboardPage` (placeholder shell) |
| `/{locale}/instructor/courses` | `instructor/courses/page.tsx` | `InstructorCoursesPage` |
| `/{locale}/instructor/courses/{courseId}/{info,outline,collaborators,pricing,certificate,review-history}` | `instructor/courses/[courseId]/{info,outline,collaborators,pricing,certificate,review-history}/page.tsx` | `InstructorCourseEditorPage` (`tab=...`) via shared `renderInstructorCourseEditorRoute`; `pricing`/`certificate` are placeholders; `review-history` = paginated approve/reject cards with URL query `page`, `status` |
| `/{locale}/instructor/tickets` | `instructor/tickets/page.tsx` | `InstructorTicketsPage` |
| `/{locale}/sysadmin` | `sysadmin/page.tsx` | `SysadminDashboardPage` (placeholder shell) |
| `/{locale}/sysadmin/courses` | `sysadmin/courses/page.tsx` | Redirect to `/sysadmin/courses/all` |
| `/{locale}/sysadmin/courses/{all,reviewing,trash}` | `sysadmin/courses/{all,reviewing,trash}/page.tsx` | `CourseAdminAllPage`, `CourseReviewPage` (`scope="sysadmin"`, adds Preview in the ⋮ menu), `CourseAdminTrashPage` |
| `/{locale}/sysadmin/courses/reviewing/{courseId}/preview` | `sysadmin/courses/reviewing/[courseId]/preview/page.tsx` | `CourseReviewPreviewPage` - Implemented (placeholder) |
| `/{locale}/sysadmin/instructors/{roster,approvals,expertise,tickets}` | `sysadmin/instructors/{roster,approvals,expertise,tickets}/page.tsx` | Same shared instructor screens (roster deep link as admin) |
| `/{locale}/sysadmin/instructors/profiles` | `sysadmin/instructors/profiles/page.tsx` | Redirect to roster |
| `/{locale}/sysadmin/taxonomy/{levels,topics,outcomes,skills,tags}` | `sysadmin/taxonomy/{levels,topics,outcomes,skills,tags}/page.tsx` | Shared `TaxonomyListPage` |
| `/{locale}/*` (unknown) | `not-found.tsx` chain | `NotFoundPage` |
| `/{locale}/admin/users`, ... | - | Remaining placeholder nav links outside the implemented taxonomy, instructor and course-review surfaces |

## Route classification and constants

Single source: `src/constants/route.ts`. Builders/helpers: `src/lib/navigation/routes.ts` (no string interpolation in screens).

- `PUBLIC_ROUTES` (no login): `home` (`/`), `login`, `signup`, `forgotPassword`, `confirmEmail`, `logout`, `becomeInstructor` (the page itself requires login at runtime: state A shows a login CTA). `login`/`signup` are `noindex` (not in `SEO_INDEXABLE_PUBLIC_ROUTE_KEYS`).
- `PRIVATE_ROUTES` (login required): `home` (`/home`), `admin`, `instructor` (`root`, `courses`, ...), `sysadmin`, `account` groups.
- `PUBLIC_RESOURCE_ROUTES` (`course` => `/courses/:slug`) and `PRIVATE_RESOURCE_ROUTES` (`instructor.courseEditor` => `/instructor/courses/:courseId/info`, `instructor.courseEditorTab` => `/instructor/courses/:courseId/:tab`): dynamic templates with `:param`.
- Helpers: `toPublicRoute` / `toPrivateRoute`, `toPublicResourceRoute` / `toPrivateResourceRoute`, `instructorCourseEditorHref(courseId)`, `instructorCourseEditorTabHref(courseId, tab)`, `loginHref(nextPath?)` / `signupHref(nextPath?)` (build `/login?next=...` / `/signup?next=...`; login/signup are real routes, not modal-only), `courseDetailHref(slug)`, pre-built hrefs `homeHref` (`/`), `signedInHomeHref` (`/home`), `defaultPostAuthHref` (= `signedInHomeHref`, default after login, signup, OAuth, email confirm), `logoutHref`, `adminCoursesHref`. Home touchpoints (logo/title in header/dashboard) use `src/lib/navigation/home.ts` (`homeHref`, `navigateToHome`). `src/lib/navigation/flatten-route-tree.ts` (`flattenRouteTreePaths`) is the shared recursion for route trees.

```ts
router.push(toPublicRoute(PUBLIC_ROUTES.home));
router.push(toPrivateRoute(PRIVATE_ROUTES.admin.courses));
router.push(instructorCourseEditorTabHref(courseId, "outline"));
router.push(toPrivateResourceRoute(PRIVATE_RESOURCE_ROUTES.instructor.courseEditorTab, { courseId: String(courseId), tab: "certificate" }));
```

Public-routable is not SEO-indexable (see `seo-web`). Unmounted paths with no app page yet: `/forgot-password`, `/my-courses`, `/my-cart`, `/wishlist`, `/notifications`, `/account-settings`: constants and href helpers stay; the active usage (login `Link`, header dropdown groups `HEADER_DROPDOWN_ACCOUNT_GROUPS_PENDING`) is commented/not spread until pages exist (see `dashboards-and-access`). Do not delete route/API constants or business code, and do not "fix" a missing route by silencing the console: comment out (or `prefetch={false}` where a Link must stay) the usage that would prefetch a 404.

Navigation: always import `Link`, `redirect`, `useRouter`, `usePathname` from `@/i18n/navigation` (they add the locale prefix), never from `next/link` / `next/navigation`.

## App Router layout

```
src/app/
├── layout.tsx              root: <html lang> from await getLocale(), fonts (Roboto, Gilroy, GeistMono CSS vars), Sonner <Toaster position="top-right" richColors closeButton />, GSI script (accounts.google.com/gsi/client, afterInteractive), metadata title = DEFAULT_SITE_NAME
├── page.tsx                fallback redirect to routing.defaultLocale
├── not-found.tsx           global 404 (inline NextIntlClientProvider + AppProviders)
├── global-error.tsx        fatal error fallback
├── robots.ts, sitemap.ts
├── auth/{discord,x}/callback/page.tsx   locale-less OAuth popup relays
└── [locale]/
    ├── layout.tsx          validates locale (404 if unknown), NextIntlClientProvider (messages from loadMessages(locale)), AppProviders, renders `children` + `modal`
    ├── @modal/             parallel slot (login/signup interception)
    ├── (web)/              route group: BecomeInstructorPromoBanner + Header + GoogleOneTapHost + <main> + Footer
    ├── admin/ , instructor/ , sysadmin/   URL segments with DashboardLayout shells (no site Footer)
    ├── error.tsx, not-found.tsx
```

| Layout file | What it mounts |
|-------------|----------------|
| `src/app/layout.tsx` | Fonts, Sonner `<Toaster>`, `<html lang>`, root title; page-level `generateMetadata` supplies title/description |
| `src/app/[locale]/layout.tsx` | `NextIntlClientProvider`, `AppProviders` (`SWRConfig` with `provider: meCacheProvider`, `EventsStreamProvider`, `MeSwrSync`, `LanguageLocaleSync`, auth tab sync, `AuthModalBackgroundBridge`) |
| `src/app/[locale]/(web)/layout.tsx` | `BecomeInstructorPromoBanner` (learner + not dismissed), `Header`, `GoogleOneTapHost` (guests), `<main>`, `Footer` |
| `src/app/[locale]/admin/layout.tsx`, `sysadmin/layout.tsx` | `RoleDashboardLayout` -> `DashboardLayout` (`ADMIN_/SYSADMIN_DASHBOARD_ITEMS`, `admin:modify` / `sysadmin:modify` gate) + shared dashboard page header |
| `src/app/[locale]/instructor/layout.tsx` | `DashboardLayout` (`INSTRUCTOR_DASHBOARD_ITEMS`, `instructor:modify` OR `course_instructor:read` gate) + shared page header |

`(web)` is a route group (parentheses never appear in the URL). Each layer adds one concern without re-rendering its parent: root = scaffold/fonts/toasts; locale = i18n provider + SWR config; web shell = site chrome; dashboard shells = sidebar + `HeaderDashboard` (details in `dashboards-and-access`). The dashboard page-header system (static metadata `src/constants/dashboard/page-header.ts`, resolver `src/lib/navigation/dashboard-page-header.ts`, runtime overrides via `useRegisterDashboardPageHeader`) is also described there.

### `@modal` parallel slot (login/signup)

`src/app/[locale]/layout.tsx` renders `{children}{modal}`. The slot at `src/app/[locale]/@modal/`:

- `default.tsx` renders `null` (hard load with no intercepted route).
- `page.tsx` and `[...catchAll]/page.tsx` render `null` for the locale root and every other route. On a soft navigation Next keeps the previous content of an unmatched parallel slot, so without them a post-login `router.push("/home")` left the login modal mounted (and re-opened after the server redirect from `/`).
- `(.)login/page.tsx` and `(.)signup/page.tsx` are same-level intercepting routes rendering `<LoginSignupPopup type="login" | "signup" />` (`type` is a prop fixed by the intercepting route; `open` is local state, closing sets `open=false`, lets the ~100 ms Radix exit animation play, then `router.back()`; full-viewport dialog `z-300`/`z-301`).

Because `@modal` sits at the `[locale]` segment and `(web)` is transparent to segment matching, one slot intercepts `/login` and `/signup` soft navigations from **anywhere**, including dashboards, overlaying whatever page the visitor was on. A hard/direct load of `/login` or `/signup` with **no** `next` (refresh, shared link) renders the full page `(web)/login|signup/page.tsx` (`LoginPageContent`/`SignupPageContent` => `AuthCardFrame` (elevated `rounded-xl` + `shadow-xl` card) => `LoginSignupLayout` => `LoginContent`/`SignupContent` with `variant="page"`). A hard load that carries a valid `next` is turned back into the intercepted-modal experience by the background bridge below.

### Route-based login/signup modal rules

- Opening is plain navigation: `<Link href={loginHref(nextPath)}>` / `signupHref(nextPath)`. There is no Zustand state for it.
- Interception is unconditional for **any** soft navigation matching the pattern (no supported opt-out). Every "no modal here" case is a plain `<a href>` (real hard navigation, locale prefix built with `getPathname` from `@/i18n/navigation`):

| Trigger | Href |
|---------|------|
| `AuthButton` (header CTA) on any page other than `/login`/`/signup` | `<Link href={loginHref(pathname)}>` / `signupHref(pathname)` (current page via `usePathname()` as `next`; soft nav, intercepted) |
| `AuthButton` while already on `/login`/`/signup` (`isAuthRoutePath(pathname)`) | Plain `<a href={loginHref()}>` / `signupHref()` (hard nav, no `next`): a soft `Link` would self-reference and stack a modal on the page it targets |
| `DashboardLayout` auto-redirect on `unauthorized` denial | `loginHref(<denied path>)` after 500 ms (once per denied path per page load; never during a `/me` outage, which renders `MeOutagePage`) |
| Switching forms inside the modal (`variant="modal"`, default) | `<Link replace href={signupHref(nextPath)}>` / `loginHref(nextPath)` (`replace`, so the back button exits the modal in one step) |
| Switching forms on the full-page fallback (`variant="page"`) | Plain `<a href>` (a soft nav would stack a modal on the full page it targets) |

- `LoginSignupPopup` reads no store; `LoginContent`/`SignupContent` call the `onAuthenticated(destination)` prop instead of any store action.
- **Already authenticated:** `useRedirectIfAuthenticated(nextPath)` (`src/hooks/auth/use-redirect-if-authenticated.ts`, called by both contents) redirects to `resolvePostAuthHref(nextPath)` via `router.replace` and renders `null` for that one frame, only when `useGetMe().me` was already truthy on the first resolved check after mount (snapshotted once, never re-evaluated: a later guest->authenticated transition is the form's own login and belongs to `onSubmit`'s `onAuthenticated`; reacting to it once hijacked the destination).
- **Post-auth redirect:** `next` is read only through `useAuthNextParam()` (`src/hooks/auth/use-auth-next-param.ts`) and validated by **both** `isSafeInternalPath` and `isAuthRoutePath` (`src/lib/security/web/safe-redirect.ts`); a `next` of `/login` or `/signup` itself is rejected. An invalid `next` is stripped from the address bar with raw `window.history.replaceState`, **not** `router.replace` (any router navigation landing on `/login`/`/signup` would pop the modal over the page already rendering it and double the form).
- **Background bridge for a hard-loaded modal:** Next only intercepts soft navigations, so `useAuthModalBackgroundBridge()` (`src/hooks/auth/use-auth-modal-background-bridge.ts`, mounted once in `AppProviders` via `AuthModalBackgroundBridge`, the same invisible-sync-component pattern as `AuthConfirmTabSync`/`AuthLogoutTabSync`): (1) on its first effect run only (ref-guarded), if the route is `/login`/`/signup` with a validated `next`, `router.replace(next)` so the background page really renders; (2) a second effect waits until `pathname` confirms that navigation landed (not a timer/animation frame, which can fire before a slow RSC fetch completes) then `router.push` back to the login/signup destination, now a soft navigation that `@modal` intercepts. A bare `/login`/`/signup` with no `next` is unaffected. Any future route-modal-with-`next` feature can reuse the pattern.
- SWR `/me` cache across the full-page cross-link hard navigations: see `auth` (`meCacheProvider`, scoped on-mount skip).

### Error boundaries and 404

| File | When it runs | Provider / chrome |
|------|--------------|-------------------|
| `src/app/not-found.tsx` | Global fallback for unmatched URLs, outside `[locale]/layout` | Inline `NextIntlClientProvider` (locale + messages from the server) + `AppProviders` |
| `src/app/[locale]/not-found.tsx` | Locale-segment 404 (invalid child, admin/instructor unknown paths) | Inherits providers from `[locale]/layout.tsx` |
| `src/app/[locale]/(web)/not-found.tsx` | Unknown paths under `(web)` | Inherits providers; `(web)/layout` supplies Header/Footer, the screen uses `showHeader={false}` |
| `src/app/[locale]/error.tsx` | A component under `(web)`, `admin`, `instructor`, `sysadmin` throws during render | Inherits providers; renders `StatusErrorPage` (generic message) with a `reset()` retry; one boundary covers all four groups (add a group-specific one only for bespoke recovery UI) |
| `src/app/global-error.tsx` | An error escapes every boundary, including a root-layout failure | Owns its own minimal `<html>`/`<body>`: no `NextIntlClientProvider`, no data fetching, plain inline styles (cannot itself throw). Locale-aware without the provider: `errors.boundary` copy imported from `src/messages/{en,vi}.ts`, locale read from the URL's first path segment via `useSyncExternalStore` (SSR-safe), falling back to `routing.defaultLocale` |

`NotFoundPage` (`src/screen/common/not-found/not-found-page.tsx`, async Server Component) = optional `Header` (default true; false under `(web)/not-found`) + illustration (`thumbnail-page-not-found.png`) + title and two description lines (`getTranslations("notFound")`: `metaTitle`, `title`, `descriptionLine1`, `descriptionLine2`, `backToHome`, `imageAlt`) + CTA `Button asChild` + `Link href={homeHref}`. Manual test URLs: `/vi/this-route-does-not-exist`, `/en/this-route-does-not-exist`. `StatusErrorPage` (route matches but its data request failed) is described in `dashboards-and-access`.

## Screen barrels (`src/screen/`)

`src/screen/` hosts **pages only** (ESLint forbids tests under `src/screen/**`; test screens through e2e).

- `src/screen/index.ts` re-exports the `common`, `admin`, `instructor`, `sysadmin` barrels.
- `src/screen/common/`: screens used by several roles (`HomePage`, `SignedInHomePage`, `NotFoundPage`, `TaxonomyListPage`, instructor management pages, course review/catalog pages); barrel `src/screen/common/index.ts`; `common/instructor/index.ts` for roster/approvals/expertise/admin tickets; `common/course/` for the shared review/catalog screens.
- `src/screen/admin/` = `AdminDashboardPage` only; `src/screen/sysadmin/` = `SysadminDashboardPage` only; `src/screen/instructor/` = `InstructorDashboardPage`, `InstructorTicketsPage` (`tickets/page.tsx`), `InstructorCourseEditorPage` shell under `courses/` (route-backed tab triggers and active-panel mapping), barrel `src/screen/instructor/index.ts`.
- Non-page render helpers go outside `src/screen/**`: `src/components/features/course/` (editor tabs/dialogs), `src/components/features/instructor/` (shared pagination, action/footer helpers, the `renderInstructorCourseEditorRoute` adapter reused by the instructor course-editor route pages), `src/components/shared/delta-editor.tsx`.

## Global chrome (web shell)

- **BecomeInstructorPromoBanner** (`src/components/common/header/become-instructor-promo-banner.tsx`): rules in `instructor-application`.
- **Header** (`src/components/common/header/header.tsx`, async Server Component): `sticky top-[var(--site-promo-banner-height,0px)] z-20`. Desktop row (`lg:flex`): logo + site title (`getTranslations("home")` => `header.title`), `HeaderBrowseNav` (`browse-nav.tsx`, `NavigationMenu` flyout with N-column hover cascade), `SearchBar` (full width), `LocaleSwitcher`, cart button, `AuthLayout`. Mobile bar (max-lg): `HeaderMobileBar` = logo icon + burger, opening `HeaderMobileSidebar` (portal overlay, right panel `w-[min(320px,85vw)]`, backdrop `z-200` + panel `z-202`, slide-in from the right, `document.body` overflow locked while open, `Escape` closes; header = logo + title; scrollable body `overflow-y-auto` with search + `BrowseSidebarMenu` (Collapsible + `SidebarMenu*`); footer = `LocaleSwitcher fullWidth` with `languageLabel` trigger + `SidebarAuthFooter`). Breakpoint `lg` (1024 px); the cart is desktop-only. `LoginSignupPopup` is not mounted inside `Header`.
- **Footer**: `(web)/layout.tsx` imports `Footer` from `@/components/common` (barrel `src/components/common/index.ts`). `footer/footer.tsx` is an async Server Component (dark shell, `MainLogo` + brand from `getTranslations("commonFooter")`, three columns of course links as `#` placeholders until routes exist, copyright row); `footer/footer-social.tsx` is a client component (`XIcon`, `InstagramMono`, `FacebookMono` from `@public/assets/icons`, mono SVGs need `"use client"` / `useUniqueId`) with external links to X / Instagram / Facebook. i18n namespace `commonFooter` (`copyright`, `brand`, column labels, `navCourses` / `navDesign` / `navCreative` for `aria-label`s). Dashboard layouts do not render the Footer.
- **LocaleSwitcher** (`src/components/common/header/locale-switcher.tsx`, client): trigger label from `useCustomLanguage()` (default `languageLabel`; the desktop header passes `useCodeLabelLanguage` => `languageCode` `en`/`vi`; optional `currentLabel`). Menu links use `Link` from `src/i18n/navigation.ts` with `href={usePathname()}` and `locale={item.locale}` (same path, different prefix, e.g. `/vi/sysadmin` => `/en/sysadmin`, not redirected home). `LanguageLocaleSync` (in `AppProviders`) mirrors `useLocale()` into `useLanguageStore` (`hooks/language/use-sync-language-from-locale.ts`).

## Auth shell (`AuthLayout`, `LoginSignupPopup`)

`AuthLayout` states and the user menu are in `dashboards-and-access`; the login/signup flows and social login rules are in `auth`. Component tree of the modal slot:

```
[locale]/layout.tsx
└── @modal slot (only when /login or /signup is the intercepted route)
      └── LoginSignupPopup (type="login" | "signup", local `open` state)
            ├── LoginSignupLayout
            │     "login"  -> LoginContent (variant="modal", default)
            │     "signup" -> SignupContent (variant="modal", default)
            │     └── AuthSocialLogin (Discord + Google, entrypoint "login"/"signup")
            ├── LoginContent  -> handleAuthSubmit("login") -> loginAction -> mutateMe() -> onAuthenticated(destination)
            │     !success -> translateApiErrorCode(tErrors, result.code), never result.message
            └── SignupContent -> handleAuthSubmit("signup", ..., locale) -> registerAction({ locale }) -> onAuthenticated(destination)
                  !success -> translateApiErrorCode; 4010 rate-limit shows a Retry-After countdown
(web)/login/page.tsx  -> LoginPageContent  -> AuthCardFrame -> LoginSignupLayout -> LoginContent  (variant="page")
(web)/signup/page.tsx -> SignupPageContent -> AuthCardFrame -> LoginSignupLayout -> SignupContent (variant="page")
```

Dedicated auth pages: `ConfirmEmailContent` (`/confirm-email`), `LogoutContent` (`/logout`), plus the locale-less callback relays. Account/study menu paths are listed under "Route classification and constants".

## Internationalization on screens

| Namespace | Usage |
|-----------|-------|
| `home` | Header title, search placeholder |
| `home.signedIn` | `loginRequired.*`, `hero.*`, `sectionDescription`, `retry`, `expandMore`, `continueLearning.*`, `trending.*`, `popularInstructors.*`, `courseCard.imageAlt`, `coursePlaceholder.*` |
| `commonHeader` | Mobile menu (`menu.open`, `browse.categoriesTitle`, `menu.language`, `menu.account`), `userMenu.*`, `promoBanner.*` |
| `commonFooter` | Footer brand, copyright, course link labels |
| `auth` | Auth forms; Zod keys resolved via `useTranslations("auth")` |
| `auth.socialLogin` | Social buttons and toasts (`googleLogin`/`xLogin`, `googleSignup`/`xSignup`, `googleSuccess`/`googleCancelled`, `discordSuccess`/`discordCancelled`, `xSuccess`/`xCancelled`, `title`) |
| `errors.codes` | **All API failures**, numeric code keys from `src/messages/error-codes.ts` |
| `taxonomy.form.validation` / `media.validation` / `instructor.validation` / `course.validation` | Pre-submit / Zod validation only (never mixed with API codes) |

Translation files are `src/messages/en.ts` and `src/messages/vi.ts`; `LocaleSwitcher` keeps the current route on locale change.

## Adding a new page

1. Create the directory under `src/app/[locale]/` in the right segment (`(web)`, `admin`, `instructor`, `sysadmin`, ...) and add `page.tsx`.
2. Prefer a shared screen under `src/screen/common/` when several roles share the UI; keep role-specific screens only when behavior differs; the route page only imports and renders the screen.
3. Add or update the value in `src/constants/route.ts` (`PUBLIC_ROUTES`, `PRIVATE_ROUTES`, `PUBLIC_RESOURCE_ROUTES`, `PRIVATE_RESOURCE_ROUTES`) and a builder in `src/lib/navigation/routes.ts` instead of interpolating strings.
4. Update this route table, the matching entry in [`FEATURES.md`](FEATURES.md) and, for new reusable code, [`SHARED.md`](SHARED.md).
5. For forms or mutations follow the API-error vs validation split in [`ARCHITECTURE.md`](ARCHITECTURE.md) (`errors.codes.*` for API, `*.validation.*` for client).

Example: `src/app/[locale]/admin/taxonomy/levels/page.tsx` => `/vi/admin/taxonomy/levels`, importing `TaxonomyListPage` from `src/screen/common/taxonomy/` (`formDialogKey` remounts `TaxonomyFormDialog` on each create/edit open, no route change); `src/app/[locale]/admin/courses/reviewing/page.tsx` imports `CourseReviewPage` shared by admin and sysadmin.
