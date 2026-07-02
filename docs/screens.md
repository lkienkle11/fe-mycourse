# Screens & Routes (`fe`)

_Last audited: 2026-07-02 (become-instructor page implemented). Prior: course version badges, reject-fork draft._


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
| `/{locale}/become-instructor` | `src/app/[locale]/(web)/become-instructor/page.tsx` | **Active** — `BecomeInstructorPage` (instructor application states A–H); see [`instructor-application.md`](./instructor-application.md) |
| `/{locale}/confirm-email` | Active | Email confirmation page (`ConfirmEmailContent` → `confirmAction`) |
| `/{locale}/logout` | Active | Logout page (`LogoutContent` → `logoutAction`, cross-tab `broadcast:logout`) |
| `/{locale}/admin` | Active | Admin dashboard shell (`AdminDashboardPage` placeholder) |
| `/{locale}/instructor` | Active | Instructor dashboard shell (`InstructorDashboardPage` placeholder) |
| `/{locale}/instructor/courses` | Active | `InstructorCoursesPage` — editable course list, create dialog, owner-only delete |
| `/{locale}/instructor/courses/{courseId}/info` | Active | `InstructorCourseEditorPage` — route-backed basic info tab |
| `/{locale}/instructor/courses/{courseId}/outline` | Active | `InstructorCourseEditorPage` — route-backed outline tab |
| `/{locale}/instructor/courses/{courseId}/collaborators` | Active | `InstructorCourseEditorPage` — route-backed collaborators tab |
| `/{locale}/instructor/courses/{courseId}/pricing` | Active | `InstructorCourseEditorPage` — route-backed pricing placeholder |
| `/{locale}/instructor/courses/{courseId}/certificate` | Active | `InstructorCourseEditorPage` — route-backed certificate placeholder |
| `/{locale}/instructor/courses/{courseId}/review-history` | Active | `InstructorCourseEditorPage` — `CourseEditorReviewHistoryTab` (filter + pagination + URL sync) |
| `/{locale}/instructor/tickets` | Active | `InstructorTicketsPage` — create ticket, thread, close (P58) |
| `/{locale}/admin/courses` | Active | Redirect → `/admin/courses/all` |
| `/{locale}/admin/courses/all` | Active | `CourseAdminAllPage` — all courses + filter + move to trash (⋮ → `ConfirmDeleteDialog`; menu `modal={false}` + deferred `onSelect`) |
| `/{locale}/admin/courses/reviewing` | Active | `CourseReviewPage` (`scope="admin"`) — pending review queue (⋮ → approve/reject `Dialog`) |
| `/{locale}/admin/courses/trash` | Active | `CourseAdminTrashPage` — restore / permanent delete (⋮ → confirm or restore; deferred `onSelect`) |
| `/{locale}/admin/instructors/{roster,approvals,profiles,expertise,tickets}` | Active | Shared `Instructor*Page` screens imported directly from app routes |
| `/{locale}/sysadmin/instructors/{roster,approvals,profiles,expertise,tickets}` | Active | Same shared screens |
| `/{locale}/sysadmin` | Active | Sysadmin dashboard shell (`SysadminDashboardPage` placeholder) |
| `/{locale}/sysadmin/courses` | Active | Redirect → `/sysadmin/courses/all` |
| `/{locale}/sysadmin/courses/all` | Active | `CourseAdminAllPage` — all courses + filter + move to trash (same ⋮ / dialog pattern as admin) |
| `/{locale}/sysadmin/courses/reviewing` | Active | `CourseReviewPage` (`scope="sysadmin"`) — pending review queue (+ Preview link in ⋮ menu) |
| `/{locale}/sysadmin/courses/reviewing/{courseId}/preview` | Active | `CourseReviewPreviewPage` — placeholder |
| `/{locale}/sysadmin/courses/trash` | Active | `CourseAdminTrashPage` — restore / permanent delete (same ⋮ / dialog pattern as admin) |
| `/{locale}/admin/taxonomy/{resource}` | Active | Shared `TaxonomyListPage` (resource = levels \| topics \| outcomes \| skills \| tags); create/edit increments `formDialogKey` and passes `key={formDialogKey}` to `TaxonomyFormDialog` so edit hydrates from list row `initialData` |
| `/{locale}/sysadmin/taxonomy/{resource}` | Active | Same shared `TaxonomyListPage` (sysadmin menu + permissions) |
| `/{locale}/*` (unknown path) | Active | Custom 404 — `NotFoundPage` via `not-found.tsx` chain |

> Route constants (single source: `src/constants/route.ts`):
> - `PUBLIC_ROUTES`: public routes (no login required)
> - `PRIVATE_ROUTES`: private routes (login required)
> - `PUBLIC_RESOURCE_ROUTES` / `PRIVATE_RESOURCE_ROUTES`: dynamic routes with `:param`
>
> Route builders/helpers (single source: `src/lib/navigation/routes.ts`):
> - `toPublicRoute` / `toPrivateRoute`
> - `toPublicResourceRoute` / `toPrivateResourceRoute`
> - feature helpers like `instructorCourseEditorHref(courseId)` and `instructorCourseEditorTabHref(courseId, tab)`
>   Login/signup remain **modal-only** via `LoginSignupPopup`.

---

## Public vs Private Routes

- **Public routes (no login required):** values in `PUBLIC_ROUTES` (`home`, `forgotPassword`, `confirmEmail`, `logout`).
- **Private routes (login required):** values in `PRIVATE_ROUTES` (admin/instructor/sysadmin/account groups).

This split is intentionally centralized in `src/constants/route.ts` so UI config and navigation share one route source.

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
- **`src/screen/admin/`** — `AdminDashboardPage` (`page.tsx`) only. Shared admin/sysadmin content now lives under `src/screen/common/**`; app route files import those screens directly.
- **`src/screen/instructor/`** — `InstructorDashboardPage`, `InstructorTicketsPage` (`tickets/page.tsx`), `InstructorCourseEditorPage` shell under `courses/` with route-backed tab triggers and active-panel mapping; barrel: `src/screen/instructor/index.ts`.
- **`src/screen/common/instructor/`** — shared admin screens: roster, approvals, profiles, expertise, admin tickets; barrel: `src/screen/common/instructor/index.ts`.
- **`src/screen/common/course/`** — shared course review screen used by admin and sysadmin.
- **`src/components/shared/delta-editor.tsx`** — WYSIWYG `DeltaEditor` + read-only `DeltaViewer` for Quill Delta JSON (font family picker, optional hyperlink toolbar via `allowLink` + `DeltaEditorLinkDialog` — text and **image embed** links, **link text color** picker via `bindQuillLinkColorHandler` in `delta-editor-link-color.ts`, Quill Snow tooltip **Edit/Remove** via `bindQuillLinkTooltipFix` in `delta-editor-link-quill.ts`, **image embed 4-corner drag-resize** via `bindQuillImageResize` in `delta-editor-image-resize.ts`, embed × remove, `onObjectEmbedded` / `onDelete` callbacks, `MediaCollectionDialog` toolbar embeds). Quill blot/helpers in `src/lib/quill/` (`delta-editor-quill.ts`, `delta-editor-link-quill.ts`, `delta-editor-link-color.ts`, `delta-editor.css`).
- **`src/components/features/course/`** — non-page course editor tabs and dialogs (`course-editor-basic-tab.tsx`, `course-editor-outline-tab.tsx`, `course-editor-outline-row-actions.tsx`, `sub-lesson-kind-label.tsx`, `course-editor-collaborators-tab.tsx`, `course-editor-dialogs.tsx`); the three tab components consume grouped prop objects from the screen shell to keep page JSX short as tabs grow; outline rows use `SortableList` (mobile touch drag via `TouchSensor` + 44px grip handle), `CourseOutlineRowActions` (`modal={false}` + `DeferredDropdownMenuItem`) for section/lesson/item mutations, `SubLessonKindLabel` + `SUB_LESSON_KIND_ICONS` for sub-lesson type glyphs, and `OutlineDurationLabel` + `formatDurationMs` for `estimated_duration_ms` display. `SubLessonQuizFields` / `SubLessonTextFields` share `SubLessonDurationFields`; `SubLessonQuizFields` delegates single-choice correct-answer UI rules to `applyQuizAllowMultipleChange` / `applyQuizOptionCorrectChange` in `src/lib/utils/course.ts`.
- **`src/components/features/instructor/`** — shared instructor/admin/sysadmin pagination, action/footer helpers, and the `renderInstructorCourseEditorRoute` adapter reused by the 5 instructor course editor route pages.
- **`src/screen/sysadmin/`** — `SysadminDashboardPage` only. Shared admin/sysadmin content lives under `src/screen/common/**`.

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

**Layouts:** `src/app/[locale]/admin|sysadmin/layout.tsx` → `RoleDashboardLayout` → `DashboardLayout`; `src/app/[locale]/instructor/layout.tsx` uses `DashboardLayout` directly.

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
│     └── SidebarInset
│           └── main (px-2 py-4)
│                 ├── DashboardPageHeader
│                 └── role page content
└── LoginSignupPopup (when authorized)

Unauthorized: HeaderDashboard + trailing locale (lg+) + DashboardUnauthorized (no sidebar)
```

The visible dashboard page heading is now **layout-owned**, not page-owned:

- Static route metadata is stored in `src/constants/dashboard/page-header.ts` and resolved by `src/lib/navigation/dashboard-page-header.ts`. Breadcrumbs reuse sidebar nav links from the role `*DASHBOARD_ITEMS` tree.
- Dynamic client routes register runtime overrides through `useRegisterDashboardPageHeader` (`@/hooks/dashboard`).
- Pages that previously rendered top-level dashboard `<h1>` blocks now render only their feature content; pages with top-row CTAs pass those controls into the shared header action slot.

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
      │     └── !success → translateApiErrorCode(tErrors, result.code) — never result.message
      └── SignupContent → handleAuthSubmit("signup", …, locale) → registerAction({ locale })
            └── !success → translateApiErrorCode(tErrors, result.code); 4010 rate-limit shows countdown
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
| `RequiredLabel` | `required-label.tsx` | Label with red asterisk for required fields — Taxonomy, Instructor approvals, Course create dialog. |
| `FieldError` | `field-error.tsx` | Inline validation message under a field (resolves i18n key from Zod). |
| `PermissionGate` | `permission-gate.tsx` | Declarative permission guard for dashboard / feature UI. |

---

## Demo Components

_No `src/components/demo/` folder — removed 2026-06-17 (unused demo `RegisterForm`; see Knip baseline in [`quality.md`](./quality.md))._

---

## Internationalization on Screens

| Namespace | Usage |
|-----------|-------|
| `"home"` | Header title, search placeholder |
| `"commonHeader"` | Mobile menu (`menu.open`, `browse.categoriesTitle`, `menu.language`, `menu.account`) |
| `"commonFooter"` | Footer brand, copyright, course link labels |
| `"auth"` | Auth forms; Zod keys resolved via `useTranslations("auth")` |
| `"errors.codes"` | **All API failures** — numeric code keys from `src/messages/error-codes.ts` |
| `"taxonomy.form.validation"` / `"media.validation"` / `"instructor.validation"` / `"course.validation"` | Pre-submit / Zod validation only (never mixed with API codes) |

Translation files: `src/messages/en.ts` and `src/messages/vi.ts`. `LocaleSwitcher` uses `usePathname()` from `@/i18n/navigation` so locale changes keep the current route.

---

## Route Constants

Defined in `src/constants/route.ts`:

```ts
// src/constants/route.ts
PUBLIC_ROUTES = {
  home: "/",
  forgotPassword: "/forgot-password",
  confirmEmail: "/confirm-email",
  logout: "/logout",
}

PRIVATE_ROUTES = {
  admin: { ... },
  instructor: { root: "/instructor", courses: "/instructor/courses", ... },
  sysadmin: { ... },
  account: { ... },
}

PUBLIC_RESOURCE_ROUTES = {}

PRIVATE_RESOURCE_ROUTES = {
  instructor: {
    courseEditor: "/instructor/courses/:courseId/info",
    courseEditorTab: "/instructor/courses/:courseId/:tab",
  },
}
```

Build final href with `src/lib/navigation/routes.ts` helpers (no string interpolation in screens):

```ts
toPublicRoute(PUBLIC_ROUTES.home)
toPrivateRoute(PRIVATE_ROUTES.admin.courses)
instructorCourseEditorHref(courseId)
instructorCourseEditorTabHref(courseId, "outline")
toPrivateResourceRoute(PRIVATE_RESOURCE_ROUTES.instructor.courseEditorTab, {
  courseId: String(courseId),
  tab: "certificate",
})
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

API_PRIVATE_ROUTES.user.getMe           // GET    /api/v1/me
API_PRIVATE_ROUTES.user.patchMe         // PATCH  /api/v1/me
API_PRIVATE_ROUTES.user.deleteMe        // DELETE /api/v1/me
API_PRIVATE_ROUTES.user.hardDeleteMe    // DELETE /api/v1/me/hard
API_PRIVATE_ROUTES.user.getMyPermissions // GET   /api/v1/me/permissions
```

`signupAction` in `actions/auth/auth.ts` is a **deprecated alias** of `registerAction`.

Feature screens (taxonomy, media, instructor, course) catch API errors with `toastApiError(useTranslations("errors.codes"), error)` — see [`logic-flow.md` §8](./logic-flow.md).

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
| API error + validation patterns | [`docs/patterns.md`](patterns.md), [`docs/api-using.md`](api-using.md) |
| Folder layout, tech stack, design decisions | [`docs/architecture.md`](architecture.md) |
| Production deploy, env vars, Nginx | [`docs/deploy.md`](deploy.md) |
| API contracts and BE response envelopes | [`README.md`](../README.md) |
| Instructor admin routes, permissions, API | [`docs/instructor-admin.md`](instructor-admin.md) |
