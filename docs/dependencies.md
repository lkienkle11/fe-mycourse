# Dependencies

_Last audited: 2026-06-17 (`server-only` 0.0.1 runtime; `knip` 6.17.1 dev; lockfile pinned)._


All dependencies for the `fe-mycourse` project. Checked against `package.json`.

---

## Runtime Dependencies

### Framework & Core

| Package | Version | Role |
|---------|---------|------|
| `next` | 16.2.1 | App framework — App Router, Server Components, Server Actions, image optimization |
| `react` | 19.2.4 | UI rendering engine |
| `react-dom` | 19.2.4 | DOM bindings for React 19 |
| `server-only` | 0.0.1 | Runtime guard — `import "server-only"` in `src/lib/utils/auth-session.ts`; build fails if imported from client bundles |

> **Breaking-change notice:** This is Next.js **16.2** — APIs and conventions may differ from older versions. Always read `node_modules/next/dist/docs/` before using new Next.js features.

---

### HTTP & API

| Package | Version | Role |
|---------|---------|------|
| *(none — native Fetch)* | — | HTTP client — `ApiTransport` in `src/api/transport/api-transport.ts` with runtime adapters for auth header injection and transparent token refresh |
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
| `quill` | 1.3.7 | WYSIWYG editor core — `DeltaEditor` stores Quill Delta JSON (`about_course`, section `description`, lesson `summary`, TEXT sub-lesson `text_delta`); font picker + toolbar/paste/drag-drop image via `MediaCollectionDialog` when `allowMediaEmbed` (section/lesson dialogs set `false`; TEXT sub-lessons pass `TEXT_SUB_LESSON_MEDIA_EMBED_KINDS` = `["image"]` — no video); paste/drop upload delegated to parent `onObjectEmbedded` (`useDeltaEditorMediaHandlers` → `uploadMediaFiles`); embed removal via `onDelete` |
| `@types/quill` | 1.3.10 | TypeScript types for Quill (dev) |

> **Note:** We use **Quill directly** with a thin React wrapper (`DeltaEditor` in `src/components/shared/delta-editor.tsx`), not `react-quill`, because `react-quill@2.0.0` peer-depends on React ≤18 and breaks `npm ci` on React 19 without workarounds. Quill is **not** imported at module top level — `ensureQuillLoaded()` in `src/lib/quill/delta-editor-quill.ts` dynamic-imports Quill + CSS inside `useEffect` so SSR and shared barrel imports (e.g. header `SearchBar` from `@/components/shared`) do not throw `document is not defined`.

### PDF preview (instructor admin)

| Package | Version | Role |
|---------|---------|------|
| `@react-pdf-viewer/core` | 3.12.0 | PDF viewer shell — `PreviewPdfViewer` in `src/components/shared/preview-pdf-viewer.tsx` |
| `@react-pdf-viewer/default-layout` | 3.12.0 | Toolbar, sidebar, zoom plugins for admin CV/certificate preview |
| `pdfjs-dist` | 3.4.120 | PDF.js runtime (version pinned; worker URL from `src/lib/pdf-worker-url.ts`) |

> **Build note:** `pdfjs-dist` lists optional Node dep `canvas`. Turbopack production builds alias it to `src/lib/stubs/canvas.ts`; `PreviewPdf` uses `next/dynamic` `{ ssr: false }`. Do not import `@react-pdf-viewer/*` or `pdfjs-dist` at module top level outside the viewer file.

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
| `lucide-react` | ^1.7.0 | Primary SVG icon set — tree-shakeable, used throughout shadcn/ui and feature components |
| `react-icons` | 5.6.0 | Secondary icon set (Font Awesome, Material Design, etc.) — import per sub-package for tree-shaking, e.g. `react-icons/fa`, `react-icons/md` |
| `@phosphor-icons/react` | 2.1.10 | Tertiary icon set — ~9k icons, 6 weights (thin → duotone); tree-shakeable named imports, e.g. `House`, `HouseBold`, `HouseFill` |
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
| `eslint` | ^9 | Linter (`npm run lint`; CI via `test-all` on `dev`) |
| `eslint-config-next` | 16.2.1 | ESLint rules for Next.js; extended in [`eslint.config.mjs`](../eslint.config.mjs) (`src/constants/**` data-only, `src/types/**` type-only) |
| `@biomejs/biome` | ^2.4.9 | Formatter + linter: `npm run biome` / `lint:biome` (CI via `test-all`), `fix:biome` (`check --write`, safe fixes local), `format:biome` (format only) |
| `@commitlint/cli` | ^20.5.0 | Commit message linting |
| `@commitlint/config-conventional` | ^20.5.0 | Conventional Commits ruleset |
| `shadcn` | 4.2.0 | CLI tool for adding shadcn/ui components to `src/components/ui/` |
| `madge` | 8.0.0 | Circular dependency analysis — `npm run cycles` / `cycles:json`; CI via `test-all` → `quality:deps` |
| `jscpd` | 4.2.4 | Clone detection — `npm run dupl` (`.jscpd.json`, excludes shadcn `src/components/ui/**`); CI via `test-all` → `quality:deps` |
| `knip` | 6.17.1 | Dead-code gate — `npm run deadcode`; [`knip.json`](../knip.json) checks unused types + component/screen files only; CI via `test-all` |

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
6. **Icons**: Default to `lucide-react` for shadcn/ui and new UI work. Use `react-icons` for brand logos and legacy FA/MD glyphs (sub-path imports only). Use `@phosphor-icons/react` when you need extra glyphs or weight variants (bold, fill, duotone) — import only the icons you use. Do not add a fourth icon library.
7. **Toasts**: Use `sonner` (`toast.success`, `toast.error`, etc.) for user-facing notifications.
8. **Stream events**: Subscribe with `hooks/events/*`; send WS via `postSocketOutbound`, broadcast via `postBroadcastOutbound`. Do not add a second WebSocket/SSE library without updating [`delivery.md`](./delivery.md).
9. **Server-only modules**: Use runtime dep `server-only` (0.0.1) with `import "server-only"` at file top (e.g. `auth-session.ts`). Never re-export from client-safe barrels (`@/lib/utils`).
10. **Dead-code gate**: Dev dep `knip` (6.17.1) — `npm run deadcode`; config [`knip.json`](../knip.json). Pin version; run `npm install` after `package.json` changes to refresh `package-lock.json`.
11. **Quality gates**: Run **`npm run check-all`** before PRs (or **`npm run test-all`** to match CI without build). CI on **`dev`** enforces `test-all` in [`.github/workflows/deploy-dev.yml`](../.github/workflows/deploy-dev.yml) `test` job. See [`quality.md`](./quality.md). Do not use backend `make check-dupl`.
