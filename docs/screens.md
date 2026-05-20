# Screens & Routes (`fe`)

_Last audited: 2026-05-15 (GitNexus + source scan)._


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

> Route constants are defined in `src/constants/route.ts` for future auth-route constants. All authentication today is **modal-based** from the header.

---

## Layout Hierarchy

```
src/app/layout.tsx                          Root layout
│   HTML lang="vi", font variables (Roboto, Gilroy, GeistMono)
│   Sonner <Toaster position="top-right" richColors closeButton />
│
└── src/app/[locale]/layout.tsx             Locale layout
    │   Validates locale (404 if unknown)
    │   <NextIntlClientProvider>            → loads src/messages/{locale}.json
    │   <AppProviders>                      → `SWRConfig` + `MeSwrSync` → `useSyncMeFromAuth` (`hooks/auth/use-auth-store`, SWR → `useMeStore`) + `children`
    │
    └── src/app/[locale]/(web)/layout.tsx   Web shell layout
        │   Resolves locale for <Header>
        │   <Header switchedLocale={...} />
        │   <main>{children}</main>
        │   <Footer />
        │
        └── src/app/[locale]/(web)/page.tsx → <HomePage />
```

Each layout layer adds a concern without re-rendering the parent:
- **Root:** HTML scaffold, fonts, toast notifications.
- **Locale:** i18n provider, global SWR configuration.
- **Web shell:** Site chrome (`Header`), page body (`<main>{children}</main>`), site footer (`Footer`).

---

## Screen barrels (`src/screen/`)

- **`src/screen/index.ts`** — re-exports `common`, `admin`, and `instructor` barrels (import `HomePage` from `@/screen` as before).
- **`src/screen/common/`** — shared web-facing screens (e.g. marketing home). Barrel: `src/screen/common/index.ts`.
- **`src/screen/admin/`** — admin-role screens (barrel: `src/screen/admin/index.ts`; add modules and re-exports when routes exist).
- **`src/screen/instructor/`** — instructor-role screens (barrel: `src/screen/instructor/index.ts`).

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

## Global Chrome

### Header

**File:** `src/components/common/header/header.tsx` — async Server Component.

```
Header
├── Logo + site title (getTranslations("home") → t("header.title"))
├── HeaderBrowseNav (src/components/common/header/browse-nav.tsx)
│     Client — single module; Tailwind `md:` splits desktop vs mobile
│     Desktop (md+): NavigationMenu flyout, recursive N-column hover cascade
│       activeStack[0] = hovered root → column 2 shows its children
│       activeStack[1] = hovered child → column 3 shows grandchildren, …
│     Mobile (max-md): Sheet + nested Accordion (MobileMenuItems recurses)
├── SearchBar (src/components/shared/search-bar.tsx)
│     Hidden on mobile (max-lg:hidden), visible lg+
├── LocaleSwitcher (src/components/common/header/locale-switcher.tsx)
│     Displays current locale label (e.g. "Tiếng Việt")
│     On click → navigate to the same path in the other locale
├── Cart button (lucide-react ShoppingCart icon, outline variant)
└── AuthLayout (src/components/common/auth-menu/auth-layout.tsx)
```

### Footer

**Imports:** `(web)/layout.tsx` pulls `Footer` from `@/components/common` (barrel: `src/components/common/index.ts`).

**Files:**

| File | Role |
|------|------|
| `src/components/common/footer/footer.tsx` | Async **Server Component** — dark shell, `MainLogo` + brand from `getTranslations("commonFooter")`, three columns of course links (placeholders `#` until routes exist), copyright row. |
| `src/components/common/footer/footer-social.tsx` | **Client** — `XIcon`, `InstagramMono`, `FacebookMono` from `@public/assets/icons` (mono social SVGs need `"use client"` / `useUniqueId`). External links to X / Instagram / Facebook. |

**i18n:** Namespace `commonFooter` in `src/messages/en.json` and `src/messages/vi.json` (`copyright`, `brand`, column link labels, `navCourses` / `navDesign` / `navCreative` for `aria-label`s).

**Note:** `WebLayout` always renders `Footer`.

### Locale Switcher

**File:** `src/components/common/header/locale-switcher.tsx` — client component.

Uses `usePathname` + `useRouter` from `src/i18n/navigation.ts` to switch between `en` and `vi` while preserving the current path.

---

## Auth Shell (`AuthLayout`)

**File:** `src/components/common/auth-menu/auth-layout.tsx` — client component (uses `useAuth` SWR hook).

The header's authentication chrome. Renders one of three states:

| State | Condition | Rendered |
|-------|-----------|----------|
| Loading | `isLoading === true` | `size-10` pulse placeholder (`animate-pulse` rounded circle) |
| Authenticated | `me !== null` | `<UserMenu me={me} />` |
| Unauthenticated | `me === null` | `<AuthButton />` + `<LoginSignupPopup />` |

### Component tree (unauthenticated)

```
AuthLayout
├── AuthButton (src/components/common/auth-menu/auth-button.tsx)
│     → onClick: openLoginModal() via useAuthStore
└── LoginSignupPopup (src/components/common/auth-menu/auth/login-signup-popup.tsx)
      → visible when authAction === "login" || "signup"
      ├── LoginSignupLayout (auth/login-signup-layout.tsx)
      │     Tab: "login"  → LoginContent
      │     Tab: "signup" → SignupContent
      │     └── AuthSocialLogin (auth-social-login/auth-social-login.tsx) [stub]
      ├── LoginContent (auth/login-content.tsx)
      │     react-hook-form + loginSchema (Zod)
      │     → handleAuthSubmit("login", values) → loginAction
      └── SignupContent (auth/signup-content.tsx)
            react-hook-form + signupSchema (Zod)
            → handleAuthSubmit("signup", values, locale) → registerAction → POST /auth/register
```

### Component tree (authenticated)

```
AuthLayout
└── UserMenu (src/components/common/auth-menu/user-menu.tsx)
      Props: me: MeResponse
      Displays: avatar (pickCharacter fallback), display_name, email
      └── DropdownMenu (Radix)
            ├── Study group: My Courses, My Cart, Wishlist
            ├── Account group: Notifications, Account Settings
            └── Session group: Logout
```

#### Dropdown menu items (from `src/constants/common.ts`)

```ts
HEADER_DROPDOWN_ITEMS = [
  { key: "study",   items: ["/my-courses", "/my-cart", "/wishlist"] },
  { key: "account", items: ["/notifications", "/account-settings"] },
  { key: "session", items: ["/logout"] },   // styled warning (hover:text-red-500)
]
```

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
| `"home"` | Header title (`t("header.title")`), search placeholder (`t("search.placeholder")`) |
| `"commonFooter"` | Footer brand, copyright, course link labels, nav `aria-label`s |
| `"auth"` | Auth form labels, button text, validation messages (resolved from Zod schema keys) |

Translation files: `src/messages/en.json` and `src/messages/vi.json`. The `LocaleSwitcher` toggles between locales while preserving the current URL path (via `next-intl` navigation helpers).

---

## Route Constants

Defined in `src/constants/route.ts`:

```ts
PUBLIC_ROUTES = {
  home: "/",
  auth: {
    login:  "/auth/login",
    signup: "/auth/signup",
  },
}
```

These are **string constants** for client-side `Link` / `router.push` usage. Neither `/auth/login` nor `/auth/signup` have corresponding App Router segments today — they are reserved for future dedicated pages. Authentication is currently handled entirely via the `LoginSignupPopup` modal triggered from the header.

---

## API Routes Constants

Defined in `src/constants/api-route.ts` (used by callers, not navigation):

```ts
API_PUBLIC_ROUTES.auth.login    // POST /api/v1/auth/login
API_PUBLIC_ROUTES.auth.signup   // POST /api/v1/auth/signup
API_PUBLIC_ROUTES.auth.refresh  // POST /api/v1/auth/refresh

API_PRIVATE_ROUTES.user.getMe   // GET  /api/v1/me
```

---

## GitNexus Cluster Mapping

Symbol and edge counts change as the codebase grows. Refresh the local graph with `npx gitnexus analyze --force` (from this repo root), then `npx gitnexus status` or `npx gitnexus query -r fe-mycourse "<topic>"` for up-to-date clusters and flows.

| Cluster | Component surface |
|---------|------------------|
| **Ui** | `src/components/ui/*`, home sections, `SearchBar`, `LocaleSwitcher`, `Header`, `Footer`, `FooterSocial` |
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
