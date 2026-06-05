# Screens & Routes (`fe`)

_Last audited: 2026-06-05 (course routes + screen sharing sync)._


Inventory of **App Router** routes, primary screen compositions, major UI surfaces, and component trees. Locale behavior follows **`next-intl`**: paths are always prefixed with `/{locale}` (e.g. `/vi`, `/en`) because `localePrefix` is `"always"` in `src/i18n/routing.ts`. When in doubt about how a surface connects to the rest of the app, use GitNexus from this repo root, e.g. `npx gitnexus query -r fe-mycourse "web layout footer"` or `npx gitnexus context -r fe-mycourse Footer`.

---

## Locale Configuration

| Setting | Value | Source |
|---------|-------|--------|
| Supported locales | `["en", "vi"]` | `src/i18n/routing.ts` |
| Default locale | `vi` | `src/i18n/routing.ts` |
| Locale prefix | `always` | `src/i18n/routing.ts` |
| Middleware | `src/proxy.ts` | See `docs/deploy.md` Appendix C |

The root page (`src/app/page.tsx`) immediately redirects to `/vi` (default locale) using the typed `redirect` helper from `src/i18n/navigation.ts`.

---

## Route Table

| URL pattern | Source file | What the user sees |
|-------------|------------|---------------------|
| `/` | `src/app/page.tsx` | **Locale redirect** → `/vi` (308 Permanent Redirect via `next-intl` navigation) |
| `/{locale}` | `src/app/[locale]/(web)/page.tsx` | **Home page** — renders `HomePage` |
| `/{locale}/auth/login` | (future) | Login page (planned, not yet implemented) |
| `/{locale}/confirm-email` | Active | Email confirmation page (`ConfirmEmailContent` → `confirmAction`) |
| `/{locale}/logout` | Active | Logout page (`LogoutContent` → `logoutAction`, cross-tab `broadcast:logout`) |
| `/{locale}/admin` | Active | Admin dashboard shell (`AdminDashboardPage` placeholder) |
| `/{locale}/instructor` | Active | Instructor dashboard shell (`InstructorDashboardPage` placeholder) |
| `/{locale}/instructor/courses` | Active | `InstructorCoursesPage` — editable course list, create dialog, owner-only delete |
| `/{locale}/instructor/courses/{courseId}` | Active | `InstructorCourseEditorPage` — basic info, outline, collaborators, pricing placeholder, certificate placeholder |
| `/{locale}/instructor/tickets` | Active | `InstructorTicketsPage` — create ticket, thread, close (P58) |
| `/{locale}/admin/courses` | Active | `CourseReviewPage` — admin draft review queue |
| `/{locale}/admin/instructors/{roster,approvals,profiles,expertise,tickets}` | Active | `AdminInstructor*Page` → shared `Instructor*Page` in `src/screen/common/instructor/` |
| `/{locale}/sysadmin/instructors/{roster,approvals,profiles,expertise,tickets}` | Active | `SysadminInstructor*Page` → same shared screens |
| `/{locale}/sysadmin` | Active | Sysadmin dashboard shell (`SysadminDashboardPage` placeholder) |
| `/{locale}/sysadmin/courses` | Active | `CourseReviewPage` — sysadmin draft review queue |
| `/{locale}/admin/taxonomy/{resource}` | Active | `AdminTaxonomy*Page` → shared `TaxonomyListPage` (resource = levels \| topics \| outcomes \| skills \| tags) |
| `/{locale}/sysadmin/taxonomy/{resource}` | Active | `SysadminTaxonomy*Page` → same shared `TaxonomyListPage` (sysadmin menu + permissions) |
| `/{locale}/*` (unknown path) | Active | Custom 404 — `NotFoundPage` via `not-found.tsx` chain |

> `PUBLIC_ROUTES` (`src/constants/route.ts`): `home`, `confirmEmail`, `logout`. Login/signup are **modal-only** via `LoginSignupPopup`; confirm/logout have dedicated routes.

---

## Layout Hierarchy

```
src/app/layout.tsx                          Root layout
│   HTML lang="vi", font variables (Roboto, Gilroy, GeistMono)
│   Sonner <Toaster position="top-right" richColors closeButton />
│
└── src/app/[locale]/layout.tsx             Locale layout
    │   Validates locale (404 if unknown)
    │   <NextIntlClientProvider>            → messages from loadMessages(locale) in request.ts
    │   <AppProviders>                      → `SWRConfig` + `MeSwrSync` + `LanguageLocaleSync` + stream/auth tab sync + `children`
    │
    ├── src/app/[locale]/(web)/layout.tsx   Web shell layout
    │     <Header /> + <main> + <Footer /> → HomePage, confirm-email, logout
    ├── src/app/[locale]/admin/layout.tsx   DashboardLayout (admin items, `admin:modify`)
    ├── src/app/[locale]/instructor/layout.tsx
    └── src/app/[locale]/sysadmin/layout.tsx
```

Each layout layer adds a concern without re-rendering the parent:
- **Root:** HTML scaffold, fonts, toast notifications.
- **Locale:** i18n provider, global SWR configuration.
- **Web shell:** Site chrome (`Header`), page body (`<main>{children}</main>`), site footer (`Footer`).
- **Dashboard shells:** `DashboardLayout` (sidebar + `HeaderDashboard`), no site `Footer`.

---

## Screen barrels (`src/screen/`)

- **`src/screen/index.ts`** — re-exports `common`, `admin`, `instructor`, and `sysadmin` barrels.
- **`src/screen/common/`** — shared screens used by multiple roles (e.g. marketing `HomePage`, `NotFoundPage`, `TaxonomyListPage`, instructor management pages). Barrel: `src/screen/common/index.ts`.
- **`src/screen/admin/`** — `AdminDashboardPage` (`page.tsx`) plus role-specific routes such as `taxonomy/{resource}/page.tsx` (`AdminTaxonomy*Page` wrappers). Barrel: `src/screen/admin/index.ts`.
- **`src/screen/instructor/`** — `InstructorDashboardPage`, `InstructorTicketsPage` (`tickets/page.tsx`), `InstructorCourseEditorPage` shell under `courses/`; barrel: `src/screen/instructor/index.ts`.
- **`src/screen/common/instructor/`** — shared admin screens: roster, approvals, profiles, expertise, admin tickets; barrel: `src/screen/common/instructor/index.ts`.
- **`src/screen/common/course/`** — shared course review screen used by admin and sysadmin.
- **`src/components/features/course/`** — non-page course editor tabs and dialogs (`course-editor-basic-tab.tsx`, `course-editor-outline-tab.tsx`, `course-editor-collaborators-tab.tsx`, `course-editor-dialogs.tsx`).
- **`src/components/features/instructor/`** — shared instructor/admin/sysadmin pagination and action/footer helper components.
- **`src/screen/admin/instructor/`** — thin wrappers per route (`roster`, `approvals`, `profiles`, `expertise`, `tickets`).
- **`src/screen/sysadmin/instructor/`** — same wrappers for sysadmin.
- **`src/screen/sysadmin/`** — `SysadminDashboardPage` plus `taxonomy/{resource}/page.tsx` (`SysadminTaxonomy*Page` wrappers). Barrel: `src/screen/sysadmin/index.ts`.

---

## Home Screen (`HomePage`)

**File:** `src/screen/common/home/page.tsx` — async Server Component.

Assembles the marketing landing page from seven section components, all living under `src/components/home/`:

```
HomePage (server)
├── HeroSection              → Primary hero / call-to-action
├── SearchSection            → Course search entry point
├── TopCoursesSection        → Curated / featured courses grid
├── AdvancedPromoSection     → Secondary promotional banner
├── TrendingCoursesSection   → Trending courses carousel/grid
├── UpcomingWebinarsSection  → Upcoming live sessions list
└── PromoSection             → Bottom promotional strip / CTA
```

**Supporting components:**
- `CourseCard` (`src/components/home/course-card.tsx`) — reusable card used by course-listing sections.

---

## Not Found Screen (`NotFoundPage`)

**File:** `src/screen/common/not-found/not-found-page.tsx` — async Server Component.

**Routes:**
- `src/app/not-found.tsx` — global fallback (explicit `NextIntlClientProvider` + `AppProviders`)
- `src/app/[locale]/not-found.tsx` — locale-level 404 (inherits providers from `[locale]/layout.tsx`)
- `src/app/[locale]/(web)/not-found.tsx` — web shell 404 (`showHeader={false}`; `(web)/layout` supplies Header/Footer)

**Composition:**
```
NotFoundPage (server)
├── Header (optional — default true; false under (web)/not-found)
├── Illustration — next/image → thumbnail-page-not-found.png
├── Title + two description lines — getTranslations("notFound")
└── CTA — Button asChild + Link href={homeHref}
```

**i18n keys** (`notFound`): `metaTitle`, `title`, `descriptionLine1`, `descriptionLine2`, `backToHome`, `imageAlt`.

---

## Global Chrome

### Header

**File:** `src/components/common/header/header.tsx` — async Server Component.

```
Header (src/components/common/header/header.tsx)
├── Desktop row (lg+): hidden below lg via `lg:flex`
│     Logo + site title (getTranslations("home") → t("header.title"))
│     HeaderBrowseNav (browse-nav.tsx) — NavigationMenu flyout, N-column hover cascade
│     SearchBar — full width in header row
│     LocaleSwitcher, Cart button, AuthLayout
├── Mobile bar (max-lg): HeaderMobileBar — logo icon + burger only
│     Opens HeaderMobileSidebar (portal overlay, right panel `w-[min(320px,85vw)]`)
│         Backdrop `z-200` + panel `z-202`, slide-in from right; `document.body` overflow locked while open; `Escape` closes
│         Sidebar header: logo + title
│         Scrollable body: `overflow-y-auto` (search + `BrowseSidebarMenu` — Collapsible + `SidebarMenu*`)
│         Footer: LocaleSwitcher (`fullWidth`, `languageLabel` trigger) + SidebarAuthFooter
└── LoginSignupPopup — sibling after </header> (z-300 overlay / z-301 content, centered card)
```

Breakpoint: **`lg` (1024px)**. Cart is desktop-only (not in mobile bar or sidebar).

### Footer

**Imports:** `(web)/layout.tsx` pulls `Footer` from `@/components/common` (barrel: `src/components/common/index.ts`).

**Files:**

| File | Role |
|------|------|
| `src/components/common/footer/footer.tsx` | Async **Server Component** — dark shell, `MainLogo` + brand from `getTranslations("commonFooter")`, three columns of course links (placeholders `#` until routes exist), copyright row. |
| `src/components/common/footer/footer-social.tsx` | **Client** — `XIcon`, `InstagramMono`, `FacebookMono` from `@public/assets/icons` (mono social SVGs need `"use client"` / `useUniqueId`). External links to X / Instagram / Facebook. |

**i18n:** Namespace `commonFooter` in `src/messages/en.ts` and `src/messages/vi.ts` (`copyright`, `brand`, column link labels, `navCourses` / `navDesign` / `navCreative` for `aria-label`s).

**Note:** `(web)/layout.tsx` always renders `Footer`. Dashboard layouts do not.

### Locale Switcher

**File:** `src/components/common/header/locale-switcher.tsx` — client component.

- Trigger label from `useCustomLanguage()`: default `languageLabel`; desktop header passes `useCodeLabelLanguage` → shows `languageCode` (`en` / `vi`). Optional `currentLabel` override.
- Menu links use `Link` from `src/i18n/navigation.ts` with `href={usePathname()}` and `locale={item.locale}` — same path, different locale prefix (e.g. `/vi/sysadmin` → `/en/sysadmin`; **not** redirected to home).
- Store sync: `LanguageLocaleSync` in `AppProviders` mirrors `useLocale()` → `useLanguageStore` (`hooks/language/use-sync-language-from-locale.ts`).

---

## Dashboard Shell (`DashboardLayout`)

**Layouts:** `src/app/[locale]/{admin,instructor,sysadmin}/layout.tsx` → `DashboardLayout` with role-specific `*_DASHBOARD_ITEMS` and permission gate.

**Screens:** `src/screen/{admin,instructor,sysadmin}/page.tsx` — placeholder pages inside `main`.

Does **not** use site `Header` / `Footer`. Reuses `LocaleSwitcher` with the **same breakpoints as the marketing header** (`header.tsx` + `header-mobile-sidebar.tsx`):

```
DashboardLayout (authorized)
├── SidebarProvider
│     ├── HeaderDashboard
│     │     leading: DashboardMenuTrigger (burger, md:hidden → mobile Sheet)
│     │     trailing: DashboardHeaderLocale — LocaleSwitcher useCodeLabelLanguage (lg+ only)
│     │     AuthLayout
│     ├── Sidebar (collapsible="icon", fixed below header)
│     │     DashboardSidebarMobileHeader — logo + close (md:hidden, inside Sheet)
│     │     SidebarContent — DashboardSidebar or loading skeletons
│     │     DashboardSidebarLocaleFooter — LocaleSwitcher fullWidth + onNavigate close (lg:hidden)
│     │     SidebarFooter (md+) — SidebarTrigger (collapse)
│     └── SidebarInset → main (px-2 py-4) → role page
└── LoginSignupPopup (when authorized)

Unauthorized: HeaderDashboard + trailing locale (lg+) + DashboardUnauthorized (no sidebar)
```

| Breakpoint | Locale control |
|------------|----------------|
| **`lg+` (1024px)** | Compact code label on top bar (`useCodeLabelLanguage`), same as desktop `header.tsx` |
| **Below `lg`** | Full-width switcher at bottom of mobile nav sheet (`fullWidth`, `triggerClassName="justify-between"`), same as `HeaderMobileSidebar` footer |

Sidebar collapsed icons use `SidebarMenuButton` tooltips; `SidebarProvider` includes `TooltipProvider`.

---

## Auth Shell (`AuthLayout` + `LoginSignupPopup`)

**`AuthLayout`** — `src/components/common/auth-menu/auth-layout.tsx` (client). Uses **`useGetMe()`** (Zustand mirror of SWR `useAuth`, synced by `MeSwrSync`).

| State | Condition | Rendered |
|-------|-----------|----------|
| Loading | `isLoading === true` | `size-10` pulse placeholder |
| Authenticated | `me !== null` | `<UserMenu me={me} />` |
| Unauthenticated | `me === null` | `<AuthButton />` only |

**`LoginSignupPopup`** — mounted in **`header.tsx`** after `</header>` (not inside `AuthLayout`). Visible when `authAction === "login" || "signup"` (`useAuthStore`). Full-viewport dialog `z-300`/`z-301`.

### Component tree (unauthenticated)

```
Header
├── AuthLayout
│     └── AuthButton → openLoginModal() via useAuthStore
└── LoginSignupPopup (sibling, outside sticky header)
      ├── LoginSignupLayout
      │     "login"  → LoginContent
      │     "signup" → SignupContent
      │     └── AuthSocialLogin [stub]
      ├── LoginContent → handleAuthSubmit("login") → loginAction → mutateMe()
      └── SignupContent → handleAuthSubmit("signup", …, locale) → registerAction
```

**Dedicated auth pages:** `ConfirmEmailContent` (`/confirm-email`), `LogoutContent` (`/logout`).

### Component tree (authenticated)

```
AuthLayout
└── UserMenu (src/components/common/auth-menu/user-menu.tsx)
      Props: me: MeResponse
      Displays: avatar (pickCharacter fallback), display_name, email
      └── DropdownMenu (Radix)
            ├── Role-switch group: Sysadmin, Admin, Instructor
            ├── Study group: My Courses, My Cart, Wishlist
            ├── Account group: Notifications, Account Settings
            └── Session group: Logout
```

#### Dropdown menu items (`HEADER_DROPDOWN_ITEMS` in `src/constants/common.ts`; types in `src/types/user-menu.ts`)

| Item | Route | Permissions (FE UI guard) |
|------|-------|---------------------------|
| My Courses | `/my-courses` | *(temporarily none — config guard commented out)* |
| My Cart | `/my-cart` | *(temporarily none — config guard commented out)* |
| Wishlist | `/wishlist` | *(temporarily none — config guard commented out)* |
| Notifications | `/notifications` | *(temporarily none — config guard commented out)* |
| Account Settings | `/account-settings` | *(temporarily none — config guard commented out)* |
| Sysadmin | `/sysadmin` | `sysadmin:modify` |
| Admin | `/admin` | `admin:modify` |
| Instructor | `/instructor` | `instructor:modify` |
| Logout | `/logout` | *(none — always visible when logged in)* |

Groups `roles`, `study`, `account`, and `session` have no group-level permissions (gating is per item). `UserMenuDropdownItems` calls `useFilteredUserMenuGroups()`; the role-switch links are filtered by role-modify permissions, while the legacy study/account links currently remain visible because their per-item guards are intentionally commented out. All current items expose `titleKey` → `commonHeader.userMenu.*` while retaining the existing `title` string in config.

Rendered via `UserMenuDropdownItems` in `UserMenu` and `SidebarAuthFooter`.

---

## UI Primitives (`src/components/ui/`)

Built on Radix UI headless components, styled with Tailwind CSS, managed via shadcn:

| Component | Radix primitive | Used in |
|-----------|----------------|---------|
| `Button` | `@radix-ui/react-slot` | Header, auth forms, all CTAs |
| `Dialog` | `@radix-ui/react-dialog` | `LoginSignupPopup` modal |
| `Input` | — (native `<input>`) | Login/signup forms |
| `InputGroup` | — | Form field wrapper with icon slots |
| `Field` | — | Label + control + error container |
| `Label` | — | `<label>` styled component |
| `Textarea` | — | Text area (available for future forms) |
| `Checkbox` | `@radix-ui/react-checkbox` | "Remember me" in login form |
| `Avatar` | `@radix-ui/react-avatar` | User menu, course cards |
| `Badge` | — | Tags, status indicators |
| `Card` | — | Course cards, content panels |
| `Separator` | `@radix-ui/react-separator` | Visual dividers |
| `DropdownMenu` | `@radix-ui/react-dropdown-menu` | User menu dropdown |

All primitives are re-exported from `src/components/ui/index.ts`.

---

## Shared Components (`src/components/shared/`)

| Component | File | Role |
|-----------|------|------|
| `SearchBar` | `search-bar.tsx` | Controlled search input with optional icon, placeholder i18n, className props. Used in Header (hidden on mobile) and home SearchSection. |

---

## Demo Components (`src/components/demo/`)

| Component | File | Notes |
|-----------|------|-------|
| `RegisterForm` | `register-form.tsx` | Standalone demo registration form; not wired to a route or server action. Used for UI experimentation. |

---

## Internationalization on Screens

| Namespace | Usage |
|-----------|-------|
| `"home"` | Header title, search placeholder |
| `"commonHeader"` | Mobile menu (`menu.open`, `browse.categoriesTitle`, `menu.language`, `menu.account`) |
| `"commonFooter"` | Footer brand, copyright, course link labels |
| `"auth"` | Auth forms; Zod keys resolved via `useTranslations("auth")` |

Translation files: `src/messages/en.ts` and `src/messages/vi.ts`. `LocaleSwitcher` uses `usePathname()` from `@/i18n/navigation` so locale changes keep the current route.

---

## Route Constants

Defined in `src/constants/route.ts`:

```ts
// src/constants/route.ts
PUBLIC_ROUTES = {
  home: "/",
  confirmEmail: "/confirm-email",
  logout: "/logout",
}
```

Use with `@/i18n/navigation` `Link` / `router.push` — locale prefix is applied automatically. No `auth.login` / `auth.signup` constants (modal-only login/signup).

---

## API Routes Constants

`src/constants/api-route.ts`:

```ts
API_PUBLIC_ROUTES.auth.login     // POST /api/v1/auth/login
API_PUBLIC_ROUTES.auth.register  // POST /api/v1/auth/register
API_PUBLIC_ROUTES.auth.confirm   // POST /api/v1/auth/confirm
API_PUBLIC_ROUTES.auth.refresh   // POST /api/v1/auth/refresh
API_PUBLIC_ROUTES.auth.logout    // POST /api/v1/auth/logout

API_PRIVATE_ROUTES.user.getMe    // GET  /api/v1/me
```

`signupAction` in `actions/auth/auth.ts` is a **deprecated alias** of `registerAction`.

---

## GitNexus Cluster Mapping

Symbol and edge counts change as the codebase grows. Refresh the local graph with `npx gitnexus analyze --force` (from this repo root), then `npx gitnexus status` or `npx gitnexus query -r fe-mycourse "<topic>"` for up-to-date clusters and flows.

| Cluster | Component surface |
|---------|------------------|
| **Ui** | `src/components/ui/*`, home sections, `SearchBar`, `LocaleSwitcher`, `Header`, `HeaderDashboard`, `DashboardLayout`, `Footer`, `FooterSocial` |
| **Auth** | `AuthLayout`, `AuthButton`, `LoginSignupPopup`, `LoginContent`, `SignupContent`, `UserMenu`, `handleAuthSubmit`, auth stores and hooks |
| **Api** | `useAuth` SWR hook, `getMeService`, `createApiInstance`, `apiInstance`, `raw-http` helpers, `src/api/index.ts` barrel, callers and `methods` |

---

## Cross-Reference

| For details on… | See |
|-----------------|-----|
| Auth flow and token lifecycle | [`docs/flow.md`](flow.md) |
| Folder layout, tech stack, design decisions | [`docs/architecture.md`](architecture.md) |
| Production deploy, env vars, Nginx | [`docs/deploy.md`](deploy.md) |
| API contracts and BE response envelopes | [`README.md`](../README.md) |
| Instructor admin routes, permissions, API | [`docs/instructor-admin.md`](instructor-admin.md) |
