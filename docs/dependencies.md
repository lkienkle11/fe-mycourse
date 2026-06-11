# Dependencies

_Last audited: 2026-06-08 (Zod schemas per module + `errors.codes` i18n)._


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

### Realtime stream transports

| Package | Version | Role |
|---------|---------|------|
| `reconnecting-websocket` | 4.4.0 | WebSocket client with auto-reconnect — `src/events/socket/socket-transport.ts` |
| `@microsoft/fetch-event-source` | 2.0.1 | SSE client with abort/reconnect — `src/events/sse/sse-transport.ts` |

Envelope validation uses existing **`zod`** (see `src/events/core/normalize-inbound.ts`). NDJSON gRPC stream uses native **`fetch`** + `ReadableStream` (no extra package).

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
| `zod` | 4.3.6 | Schema validation — `src/schema/{auth,me,media,taxonomy,instructor,course}/`; validation messages use module i18n keys (separate from `errors.codes.*`) |
| `@hookform/resolvers` | ^5.2.2 | Bridge between `react-hook-form` and Zod (`zodResolver`) |

---

### Rich text (Quill)

| Package | Version | Role |
|---------|---------|------|
| `quill` | 1.3.7 | WYSIWYG editor core — `DeltaEditor` stores Quill Delta JSON (`about_course`, TEXT sub-lesson `text_delta`); font picker + toolbar/paste/drag-drop image/video via `MediaCollectionDialog` / `uploadMediaFiles` |
| `@types/quill` | 1.3.10 | TypeScript types for Quill (dev) |

> **Note:** We use **Quill directly** with a thin React wrapper (`DeltaEditor` in `src/components/shared/delta-editor.tsx`), not `react-quill`, because `react-quill@2.0.0` peer-depends on React ≤18 and breaks `npm ci` on React 19 without workarounds.

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

### UI Components (Radix / shadcn — **no Base UI**)

| Package | Version | Role |
|---------|---------|------|
| `radix-ui` | ^1.4.3 | Unified Radix package for shadcn v4 `radix-nova` components (`select`, `popover`, `sidebar`, etc.) |
| `@radix-ui/react-avatar` | ^1.1.11 | Avatar (legacy import path; pre-batch components) |
| `@radix-ui/react-checkbox` | ^1.3.3 | Checkbox |
| `@radix-ui/react-dialog` | ^1.1.15 | Dialog / modal (`login-signup-popup.tsx`) |
| `@radix-ui/react-dropdown-menu` | ^2.1.16 | Dropdown menu (`user-menu.tsx`) |
| `@radix-ui/react-separator` | ^1.1.8 | Separator (legacy; new `separator.tsx` uses `radix-ui`) |
| `@radix-ui/react-slot` | ^1.2.4 | `asChild` composition |
| `vaul` | ^1.1.2 | Drawer primitive |
| `react-day-picker` | ^10.0.1 | Calendar / date picker grid |
| `date-fns` | ^4.2.1 | Date utilities (calendar peer) |
| `embla-carousel-react` | ^8.6.0 | Carousel |
| `recharts` | ^3.8.0 | Charts |
| `react-resizable-panels` | ^4.11.1 | Resizable layouts |
| `cmdk` | ^1.1.1 | Command palette (`command.tsx`) |
| `input-otp` | ^1.4.2 | OTP input (`input-otp.tsx`) |

> **Policy:** Do **not** install `@base-ui/react` or run `shadcn add combobox`. Use `Select` + `Popover` + `Command` instead.

All UI primitives live in `src/components/ui/` and are re-exported from `src/components/ui/index.ts`.

### Drag-and-drop, tree edit & read-only graph

| Package | Version | Role |
|---------|---------|------|
| `@dnd-kit/core` | ^6.3.1 | DnD context — `SortableList`, `SortableTreeEditor` |
| `@dnd-kit/sortable` | ^10.0.0 | Sortable lists |
| `@dnd-kit/utilities` | ^3.2.2 | CSS transform helpers |
| `@dnd-kit/modifiers` | ^9.0.0 | Drag modifiers |
| `@dnd-kit/accessibility` | ^3.1.1 | Screen reader announcements |
| `@nosferatu500/react-sortable-tree` | ^5.0.0 | Legacy nested tree pkg (installed; taxonomy uses `@dnd-kit` wrappers) |
| `react-dnd` | ^16.0.1 | Peer for sortable-tree |
| `react-dnd-html5-backend` | ^16.0.1 | HTML5 backend for react-dnd |
| `@xyflow/react` | 12.10.2 | Tree graph UI (`DagreTreeDialog`; optional `nodesDraggable`) |
| `dagre` | 0.8.5 | Graph layout for dagre tree popup |

---

### Icons & Notifications

| Package | Version | Role |
|---------|---------|------|
| `lucide-react` | ^1.7.0 | SVG icon set — tree-shakeable, used throughout components |
| `sonner` | ^2.0.7 | Toast notifications — `<Toaster />` in **`src/app/layout.tsx`** (root), not `AppProviders` |

---

## Dev Dependencies

| Package | Version | Role |
|---------|---------|------|
| `typescript` | ^5 | Strict TypeScript compilation |
| `@types/node` | ^20 | Node.js type definitions |
| `@types/react` | ^19 | React 19 type definitions |
| `@types/react-dom` | ^19 | ReactDOM type definitions |
| `@types/js-cookie` | ^3.0.6 | Type definitions for `js-cookie` |
| `@types/dagre` | 0.7.54 | Type definitions for `dagre` |
| `tailwindcss` | ^4 | Dev CSS build (PostCSS pipeline) |
| `@tailwindcss/postcss` | ^4 | Tailwind PostCSS plugin for v4 |
| `eslint` | ^9 | Linter (`npm run lint`; CI `test` job on `dev`) |
| `eslint-config-next` | 16.2.1 | ESLint rules for Next.js; extended in [`eslint.config.mjs`](../eslint.config.mjs) (`src/constants/**` data-only, `src/types/**` type-only) |
| `@biomejs/biome` | ^2.4.9 | Fast formatter + linter (`npm run biome` alias, `npm run lint:biome`, `npm run format:biome`) |
| `@commitlint/cli` | ^20.5.0 | Commit message linting |
| `@commitlint/config-conventional` | ^20.5.0 | Conventional Commits ruleset |
| `shadcn` | 4.2.0 | CLI tool for adding shadcn/ui components to `src/components/ui/` |
| `madge` | ^8.0.0 | Circular dependency analysis — `npm run cycles` / `cycles:json`; CI via `quality:deps` |
| `jscpd` | ^4.2.4 | Clone detection — `npm run dupl` (`.jscpd.json`, excludes shadcn `src/components/ui/**`); CI via `quality:deps` |

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
8. **Stream events**: Subscribe with `hooks/events/*`; send WS via `postSocketOutbound`, broadcast via `postBroadcastOutbound`. Do not add a second WebSocket/SSE library without updating [`delivery.md`](./delivery.md).
9. **Quality gates**: Run `npm run quality:deps`, `npm run lint`, and `npm run test` (or individual scripts) before large refactors. CI on **`dev`** enforces the same in [`.github/workflows/deploy-dev.yml`](../.github/workflows/deploy-dev.yml) `test` job. See [`quality.md`](./quality.md). Do not use backend `make check-dupl`.
