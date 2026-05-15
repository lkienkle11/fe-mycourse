# Dependencies

_Last audited: 2026-05-15 (GitNexus + source scan)._


All dependencies for the `fe-mycourse` project. Checked against `package.json`.

---

## Runtime Dependencies

### Framework & Core

| Package | Version | Role |
|---------|---------|------|
| `next` | 16.2.1 | App framework — App Router, Server Components, Server Actions, image optimization |
| `react` | 19.2.4 | UI rendering engine |
| `react-dom` | 19.2.4 | DOM bindings for React 19 |

> **Breaking-change notice:** This is Next.js **16.2** — APIs and conventions may differ from older versions. Always read `node_modules/next/dist/docs/` before using new Next.js features.

---

### HTTP & API

| Package | Version | Role |
|---------|---------|------|
| `axios` | 1.13.6 | HTTP client — shared `apiInstance` in `src/api/instance.ts` with interceptors for auth header injection and transparent token refresh |
| `js-cookie` | 3.0.5 | Client-side cookie read/write (used inside `src/lib/utils/cookie.ts` for browser-side token access) |

---

### State Management

| Package | Version | Role |
|---------|---------|------|
| `zustand` | 5.0.12 | Global UI state — auth modal state (`useAuthStore`), current user state (`useMeStore`), API error store (`useApiError`) |
| `swr` | 2.4.1 | Server state / data fetching — `useAuth` hook for `GET /api/v1/me`; automatic revalidation, deduplication |

---

### Forms & Validation

| Package | Version | Role |
|---------|---------|------|
| `react-hook-form` | ^7.72.0 | Form state management and submission handling — used with Zod resolver |
| `zod` | 4.3.6 | Schema validation — `loginSchema`, `signupSchema` in `src/schema/auth/auth.ts`; validation messages use i18n keys |
| `@hookform/resolvers` | ^5.2.2 | Bridge between `react-hook-form` and Zod (`zodResolver`) |

---

### Internationalization

| Package | Version | Role |
|---------|---------|------|
| `next-intl` | ^4.8.3 | i18n with App Router — locale-based routing, typed `useTranslations`, locale switcher; see `src/i18n/` |

---

### Styling

| Package | Version | Role |
|---------|---------|------|
| `tailwindcss` | ^4 | Utility-first CSS — configured with Tailwind v4 (`@tailwindcss/postcss`) |
| `clsx` | ^2.1.1 | Conditional class name concatenation |
| `tailwind-merge` | ^3.5.0 | Merge Tailwind class strings without conflicts; combined with `clsx` in `cn()` utility (`src/lib/utils/cn.ts`) |
| `class-variance-authority` | ^0.7.1 | Typed component variant definitions (used in `src/components/ui/`) |
| `tw-animate-css` | ^1.4.0 | Pre-built Tailwind animation utilities |

---

### UI Components (Radix UI primitives)

| Package | Version | Role |
|---------|---------|------|
| `@radix-ui/react-avatar` | ^1.1.11 | Accessible avatar component base |
| `@radix-ui/react-checkbox` | ^1.3.3 | Accessible checkbox |
| `@radix-ui/react-dialog` | ^1.1.15 | Accessible dialog / modal (used in `login-signup-popup.tsx`) |
| `@radix-ui/react-dropdown-menu` | ^2.1.16 | Accessible dropdown menu (used in `user-menu.tsx`) |
| `@radix-ui/react-separator` | ^1.1.8 | Visual separator |
| `@radix-ui/react-slot` | ^1.2.4 | Composition primitive — `asChild` prop pattern in `Button` component |

All Radix primitives are wrapped in `src/components/ui/` following shadcn conventions.

---

### Icons & Notifications

| Package | Version | Role |
|---------|---------|------|
| `lucide-react` | ^1.7.0 | SVG icon set — tree-shakeable, used throughout components |
| `sonner` | ^2.0.7 | Toast notification system — `<Toaster />` mounted in `app-providers.tsx` |

---

## Dev Dependencies

| Package | Version | Role |
|---------|---------|------|
| `typescript` | ^5 | Strict TypeScript compilation |
| `@types/node` | ^20 | Node.js type definitions |
| `@types/react` | ^19 | React 19 type definitions |
| `@types/react-dom` | ^19 | ReactDOM type definitions |
| `@types/js-cookie` | ^3.0.6 | Type definitions for `js-cookie` |
| `tailwindcss` | ^4 | Dev CSS build (PostCSS pipeline) |
| `@tailwindcss/postcss` | ^4 | Tailwind PostCSS plugin for v4 |
| `eslint` | ^9 | Linter |
| `eslint-config-next` | 16.2.1 | ESLint rules for Next.js |
| `@biomejs/biome` | ^2.4.9 | Fast formatter + linter (`npm run lint:biome`, `npm run format:biome`) |
| `@commitlint/cli` | ^20.5.0 | Commit message linting |
| `@commitlint/config-conventional` | ^20.5.0 | Conventional Commits ruleset |
| `shadcn` | 4.2.0 | CLI tool for adding shadcn/ui components to `src/components/ui/` |

---

## Overrides

| Package | Version | Reason |
|---------|---------|--------|
| `@swc/helpers` | 0.5.21 | Pins SWC helpers to a known-compatible version (avoids transitive version conflicts) |

---

## Usage Rules

1. **Do not add duplicate functionality** — check this file before adding a new package. (e.g. `clsx` + `tailwind-merge` → already covered by `cn()`)
2. **State management split**: Zustand is for UI/global state; SWR is for server data. Do not use Zustand to fetch remote data.
3. **Validation**: Always use Zod schemas with `zodResolver` from `@hookform/resolvers`. Validation error messages must use i18n keys, not hardcoded strings.
4. **Styling**: All styles must go through Tailwind utilities. Use `cn()` for conditional merging. Use `class-variance-authority` for component variants.
5. **Radix primitives**: Always use the wrappers in `src/components/ui/` — do not import Radix primitives directly into feature components.
6. **Icons**: Always import icons from `lucide-react`. Do not add other icon libraries.
7. **Toasts**: Use `sonner` (`toast.success`, `toast.error`, etc.) for user-facing notifications.
