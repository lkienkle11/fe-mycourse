# Frontend Architecture (`fe-mycourse`)

How the **MyCourse** Next.js application is structured: technology stack, directory map, design decisions, environment, cross-cutting conventions and the API layer. Routes/layouts/locale are in [`PAGES.md`](PAGES.md); per-feature rules in [`FEATURES.md`](FEATURES.md); reusable assets in [`SHARED.md`](SHARED.md). Code graph numbers (symbols, clusters, flows) change with every commit: read them from `npx gitnexus status` / `.gitnexus/meta.json` and the GitNexus block in `AGENTS.md`, never from this file.

---

## Technology Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Framework | Next.js (App Router) | 16.2.1 | Server Components, Server Actions, `src/proxy.ts` (not `middleware.ts`) |
| UI library | React | 19.2.4 | `use client` / `use server` boundary |
| Styling | Tailwind CSS | 4.x | PostCSS plugin (`@tailwindcss/postcss`) |
| Component primitives | Radix UI (`radix-ui` + legacy `@radix-ui/*`) | various | Headless primitives; shadcn v4 batch uses the unified `radix-ui` package |
| Design system | shadcn | 4.2.0 | `components.json` style `radix-nova`; 54 files under `src/components/ui/`; no Base UI; full catalog except Combobox |
| Charts / carousel / calendar | recharts, embla-carousel-react, react-day-picker | 3.x / 8.x / 10.x | Installed via shadcn `chart`, `carousel`, `calendar` |
| DnD / tree edit | @dnd-kit/* | 6.x | `SortableList` in `src/components/shared/`; `TaxonomyTreeEditor` in `src/components/features/taxonomy/` |
| Tree graph | @xyflow/react, dagre | 12.x / 0.8.x | `DagreTreeDialog` + `dagre-tree.ts` |
| Legacy tree pkg | @nosferatu500/react-sortable-tree | 5.x | Installed; the taxonomy form uses `TaxonomyTreeEditor` instead |
| Forms | react-hook-form + zod | 7.x / 4.x | `@hookform/resolvers` bridges the two |
| i18n | next-intl | 4.x | Locales `en` and `vi`, `localePrefix: "always"` (no `ja` routing); taxonomy data labels localize from the BE via query `locale` |
| Data fetching (client) | SWR | 2.x | `SWRConfig` in `AppProviders` (`revalidateOnFocus: false`, 30 s dedup, 3 min `errorRetryInterval`, `provider: meCacheProvider`); hooks override per subscription |
| HTTP client | Xior 0.8.3 over Next.js Fetch (`ApiTransport`) | exact-pinned | Shared raw executor + isolated per-request authenticated executors with request/response interceptors; six `api*` + six `raw*` helpers |
| Global state | Zustand | 5.x | Provider-free stores (me, language, api-error, stream event log, dashboard header) |
| Realtime (client) | BroadcastChannel, SSE, WebSocket, NDJSON fetch | - | See `realtime-streams` in [`FEATURES.md`](FEATURES.md) |
| Stream libraries | `reconnecting-websocket`, `@microsoft/fetch-event-source` | 4.x / 2.x | Transports in `src/events/` |
| Toasts | Sonner | 2.x | Mounted in the root layout, `position: "top-right"` |
| Cookies (client) | js-cookie | 3.x | Browser context; `next/headers` server-side |
| Server boundary | server-only | 0.0.1 | `import "server-only"` in `auth-session.ts`, excluded from the `@/lib/utils` barrel |
| Icons | lucide-react, react-icons, @phosphor-icons/react | 1.x / 5.6.0 / 2.1.10 | Lucide default; react-icons = brands/FA/MD; Phosphor = extra glyphs + weights |
| Type checker | TypeScript | 5.x | Strict mode |
| Linter / formatter | ESLint 9 + Biome 2 | - | ESLint for Next + `src/constants|types|screen` rules; Biome check in CI; `fix:biome` / `format:biome` local only |
| Commit lint | commitlint | 20.x | `npm run lint:commit` (`--from=HEAD~1 --to=HEAD`) |
| Dependency graph | madge | 8.x | `npm run cycles`; CI via `test-all` -> `quality:deps` |
| Clone detection | jscpd | 4.x | `npm run dupl` (`.jscpd.json` excludes `src/components/ui/**`) |
| Dead-code detection | knip | 6.17.1 | `npm run deadcode` (`knip.json`: unused component/screen files; `src/types/**` unused-type reports ignored) |
| Unit/integration tests | Jest (`next/jest`) + React Testing Library + MSW | 30.5.1 / 16.3.3 / 2.11.1 (exact) | `npm test`: Node project (auth/transport/refresh-route) + jsdom project; see [`testing.md`](testing.md) |
| Browser tests | Playwright (Chromium) | 1.63.0 (exact) | `npm run test:e2e`: loopback fixture backend + fixture-configured `next build`/`next start`; CI `e2e-browser.yml`; see [`testing.md`](testing.md) |

Dependency rules:

1. Do not add duplicate functionality: check `package.json` and [`SHARED.md`](SHARED.md) first (`clsx` + `tailwind-merge` are already `cn()`). Pin versions exactly: `npm install --save-exact <pkg>@<version>` (never a bare `npm install <pkg>`, which writes a `^` range), then `npm ci` to verify the lockfile; this covers the test stack too (Jest, RTL, MSW, Playwright, undici). Do not add a second test runner, HTTP-mock library or browser-automation library without updating [`testing.md`](testing.md).
2. State split: Zustand is UI/global state, SWR is server data; never fetch remote data with Zustand.
3. Validation: Zod + `zodResolver`; messages are i18n keys.
4. Styling: Tailwind utilities only; `cn()` for conditionals; `class-variance-authority` for component variants.
5. Radix: use the wrappers in `src/components/ui/`; never import Radix primitives into feature components.
6. Icons: default `lucide-react`; `react-icons` for brand logos and legacy FA/MD glyphs (sub-path imports only); `@phosphor-icons/react` for extra glyphs/weights (import only what you use). Do not add a fourth icon library.
7. Toasts: `sonner` (`toast.success`, `toast.error`).
8. Stream events: subscribe with `hooks/events/*`; send with `postSocketOutbound` / `postBroadcastOutbound`; do not add a second WebSocket/SSE library without updating the `realtime-streams` entry.
9. Server-only modules: `import "server-only"` at file top (e.g. `auth-session.ts`); never re-export from a client-safe barrel (`@/lib/utils`).
10. Overrides: `@swc/helpers` pinned to 0.5.21 (avoids transitive version conflicts).
11. Next.js 16.2 may differ from older versions: read `node_modules/next/dist/docs/` before using new Next.js features.
12. Quill is used directly through a thin wrapper (`DeltaEditor`), not `react-quill`: `react-quill@2.0.0` peer-depends on React <= 18 and breaks `npm ci` on React 19. Quill is never imported at module top level (`ensureQuillLoaded()` in `src/lib/quill/delta-editor-quill.ts`), so SSR and shared barrel imports (e.g. header `SearchBar` from `@/components/shared`) do not throw on `document`.
13. `pdfjs-dist` lists optional Node dep `canvas`: Turbopack production builds alias it to `src/lib/stubs/canvas.ts`, and `PreviewPdf` uses `next/dynamic` `{ ssr: false }`; never import `@react-pdf-viewer/*` or `pdfjs-dist` at module top level outside the viewer file.
14. Radix: new shadcn components use the unified `radix-ui` package; some pre-batch wrappers still use legacy `@radix-ui/*` import paths (avatar, separator, checkbox, dialog, dropdown-menu). `msw` stays pinned at 2.11.1 (2.12.0 pulls the ESM-only `rettime` that `next/jest`'s SWC transform cannot consume). Knip only auto-detects the literal `jest.config.ts`, so `knip.json` lists `src/test-support/jest.setup.node.ts` as an explicit `entry`.
15. Do not install `@base-ui/react` or run `shadcn add combobox` (use `Select` + `Popover` + `Command`).

### Fonts

Loaded in `src/lib/font.ts` via `next/font/google` and applied as CSS variables in the root layout: `--font-roboto` (body, default via `font-roboto`), `--font-gilroy` (headings/display, local or Google), `--font-geist-mono` (code).

---

## High-Level Request Flow

```
Browser
  └─ DNS -> Nginx (TLS termination)
              └─ 127.0.0.1:3000 -> next start (PM2: mycourse-web / mycourse-web-dev per ecosystem.config.cjs)
                    ├─ src/proxy.ts -> locale redirect; signed-in /{locale} <-> /{locale}/home (see PAGES.md)
                    ├─ App Router layout tree (root -> [locale] -> (web) | admin | instructor | sysadmin)
                    └─ Server Actions / BFF route -> NEXT_PUBLIC_API_URL (Go API on :8080)
```

---

## Directory Map

Single source of truth for where code lives. Folder-level detail is derivable with `ls`; this section keeps what `ls` cannot say.

```
fe-mycourse/
├── AGENTS.md / CLAUDE.md   agent instructions (CLAUDE.md imports AGENTS.md via @AGENTS.md; GitNexus block auto-managed in both)
├── .ai/skills/             project skills; .claude/ and .cursor/ hold OpenSpec commands/skills
├── openspec/               changes/ (active), changes/archive/, specs/ (capability specs)
├── src/                    all application code; unit/integration *.test.ts(x) are colocated next to the source
├── e2e/                    Playwright: fixtures/server.mjs (loopback fixture backend), support/, tests/*.spec.ts
├── public/                 static assets served as-is
├── docs/                   this documentation set (see "Documentation set" below)
├── scripts/                docker/ (compose-up/down, build, health: .sh/.ps1/.cmd), e2e-lifecycle.mjs (test:e2e lifecycle)
├── docker/, Dockerfile     compose.*.yml + stack.*.yml; multi-stage Node 22 image (see docker.md)
├── .github/workflows/      enforce-main-from-dev.yml, deploy-dev.yml (test -> build, deploy temporarily commented), e2e-browser.yml
├── next.config.ts          next-intl plugin, Turbopack dev tuning, `canvas` stub alias, transpilePackages for ESM-only test deps
├── jest.config.ts, playwright.config.ts, eslint.config.mjs, biome.json, knip.json, .jscpd.json, commitlint.config.cjs, tsconfig.json
├── ecosystem.config.cjs    PM2 apps mycourse-web-dev / staging / prod
└── package.json
```

`src/` (one line per folder; conventions in bold):

| Folder | Role |
|--------|------|
| `app/` | App Router routes, layouts, `robots.ts`, `sitemap.ts`, `not-found.tsx`, `global-error.tsx`, `auth/{discord,x}/callback` (locale-less), `api/auth/refresh/route.ts` (BFF), `globals.css`, `utils.css` (incl. the `scrollbar-app` utility) |
| `screen/` | **Pages only**: ESLint restricts each module folder to `index.ts` plus `page.tsx` or `*-page.tsx`; reusable UI goes to `components/`; no tests here (cover screens with e2e) |
| `components/` | `ui/` (shadcn/Radix, do not hand-edit structural logic), `common/` (layout chrome: `header`, `footer`, `dashboard`, `auth-menu`), `home/` (guest sections + `signed-in/`), `features/` (`course`, `taxonomy`, `instructor`, `media`), `shared/` (cross-feature presentational), `providers/`, `auth/` (OAuth callback relay) |
| `actions/` | Server Actions (`"use server"`) per domain, e.g. `actions/auth/*` |
| `api/` | `core/` (fetch policy, helpers, body, redirect, `methods`, `raw-http`), `xior/`, `transport/`, `auth/` (refresh + runtime adapters), `server/` (public cache policy + `serverRawFetch`), `callers/<domain>/` (`*-factory.ts` isomorphic + `*-browser.ts`), `hooks/<domain>/` (SWR), `cache.ts` (dormant), `index.ts` barrel |
| `store/` | Provider-free Zustand stores: `auth` (`useMeStore`), `language`, `dashboard`, `events`, `api-error-store.ts`, `use-app-store.ts` (placeholder) |
| `hooks/` | `auth`, `course`, `dashboard`, `events`, `home`, `instructor`, `language`, `quill`, `searchable-select`, `slug`, `user-picker`, `use-mobile.ts` |
| `events/` | Realtime ingest: `core/`, `registry/`, `providers/`, per-transport `broadcast|sse|socket|gRPC` |
| `types/` | **Type-only** files (no `const`, functions, or `export *`; value imports from `@/constants/**` allowed only to derive types); runtime maps like `ApiErrorCode` live in `constants/`, helpers like `isApiSuccess()` in `lib/utils/` |
| `schema/` | Zod schemas by domain (`auth`, `me`, `media`, `shared` slug fields, `taxonomy`, `instructor`, `course`); barrel `@/schema` |
| `constants/` | **Data-only** modules (no functions, type exports or `.tsx`); helpers go to `lib/utils/`, types to `types/` |
| `lib/` | `utils/` (barrel `@/lib/utils`, client-safe only), `navigation/`, `seo/`, `performance/`, `security/web/`, `quill/`, `swr/`, `language/`, `i18n/`, `auth/`, `instructor-application/`, `become-instructor-banner/`, `stubs/`, `font.ts`, `pdf-worker-url.ts` |
| `config/` | Runtime config (`load-config.ts`, `items/`, `events/` per channel) |
| `i18n/` | `routing.ts`, `request.ts`, `navigation.ts` |
| `messages/` | `en.ts`, `vi.ts` (`satisfies Messages`), `error-codes.ts`, `types.ts` |
| `test-support/` | Test-only fixtures/helpers, never imported by production code (see [`testing.md`](testing.md)) |
| `proxy.ts`, `instrumentation.ts` | Locale proxy + home redirects; `register()` validating `SITE_URL` at server start |

Barrel and import rules: every feature folder has an `index.ts`; consumers import from the barrel (`@/components/common`), not the implementation file; components use named exports only (no default exports); use `@/` aliases and never relative traversal beyond one level; `import type` for type-only imports. Exceptions to the barrel: server-only files (`@/lib/utils/auth-session`), `@/lib/utils/slug`, `@/lib/utils/payload`, `@/lib/utils/tree`, `@/lib/utils/taxonomy/form-submit` (import the file directly to avoid cycles or leaking server code), and `UserAvatar` / `CourseThumbnail` (import by file path, not the `shared` barrel). Unit/integration tests are colocated; `knip.json` uses `ignoreFiles` for barrels.

### Module map (clusters)

- `Ui`: `src/components`, `src/screen`, `src/app/[locale]/(web)`, dashboard shells.
- `Auth`: `src/actions/auth`, `components/common/auth-menu`, `components/providers/google-one-tap-host.tsx`, `hooks/auth`, OAuth callback routes, `lib/utils/auth-action.ts`, `constants/auth-cookie.ts`, `schema/auth`, `types/auth`.
- `Api`: `src/api`, `constants/api-route.ts`, `constants/api-error-code.ts`, `types/api.ts`, `lib/utils/{api,api-error}.ts`.
- `Validation + i18n errors`: `schema/**`, `messages/error-codes.ts`, `components/shared/{required-label,field-error,form-field}.tsx`, `lib/utils/validation-message.ts`.
- `Events`: `events`, `hooks/events`, `store/events`, `types/events`, `config/events`.
- `State`: `store`, `hooks/auth`, `hooks/language`.
- `Routing + i18n`: `app`, `i18n`, `proxy.ts`, `lib/navigation/signed-in-home-redirect.ts`, `messages`.
- `Shared`: `lib/utils`, `constants`, `config`.
- Feature modules (`Taxonomy`, `Media`, `Instructor application`, `Instructor`, `Course`) map to the entries of the same name in [`FEATURES.md`](FEATURES.md).

Cross-module contracts: `Auth UI -> actions/auth/auth-client -> actions/auth -> api/callers` for submit, UI maps `result.code` via `translateApiErrorCode(tErrors, code)`; OAuth: `AuthSocialLogin / GoogleOneTapHost -> hooks/auth -> actions/auth/{discord-oauth,google-oauth,x-oauth} -> lib/utils/auth-action (finalizeAuthLoginAction) -> api/callers/auth`; `api/hooks/auth/useAuth -> hooks/auth/use-auth-store` for SWR-to-Zustand sync; every feature `catch` after an API call -> `toastApiError(useTranslations("errors.codes"), error)`; `api/api-transport` + runtime adapters depend on `lib/utils/cookie` / `auth-session` for token cookies; `AppProviders -> EventsStreamProvider -> events/registry` starts transports which call `events/core/publish` -> `store/events`; feature UI listens via `hooks/events/*`.

`AppProviders` (`src/components/providers/app-providers.tsx`) hosts `SWRConfig`, `EventsStreamProvider`, null-render sync components (`MeSwrSync`, `LanguageLocaleSync`, `AuthConfirmTabSync`, `AuthLogoutTabSync`, `AuthModalBackgroundBridge`) and `children`; there is no React Context for language (`src/lib/language/resolve-language.ts`).

### Documentation set

`docs/` is the fixed set `ARCHITECTURE.md`, `PAGES.md`, `FEATURES.md`, `SHARED.md`, `ALL-SPRINTS.md` plus satellites `deploy.md`, `docker.md`, `quality.md`, `testing.md` and dated handoff notes. Never add a new docs file: add or edit an entry. See the "Repository specifics" section of `AGENTS.md` for the update rules.

---

## Key Design Decisions

1. **Server Actions for login.** Login/signup calls go through `"use server"` actions: the browser network panel never sees the Go API endpoint or the raw token exchange, and the server relays `Set-Cookie` reliably.
2. **HttpOnly auth cookies.** `access_token`, `refresh_token`, `session_id` (names in `src/constants/auth-cookie.ts`) are `HttpOnly`, `SameSite=Lax`, `secure` in production (`buildAuthCookieOptions`). Browser calls use `credentials: "include"` and the BE reads the JWT from the `access_token` cookie when no `Authorization` header is present; server code reads cookies via `next/headers` and attaches `Authorization: Bearer`. After silent refresh the BFF proxy and server writable refresh rewrite cookies through `setAuthSessionCookies` with BE `Set-Cookie` Max-Age (fallback `auth_session_expires_at`); when the BE rejects the refresh with `401`/`403` the same two paths remove all session cookies through `clearAuthSessionCookies`, so a dead session cannot keep pinning the presence-based proxy redirect (other failures keep the cookies); upstream refresh uses `rawPostRefreshUpstream` (fail-closed redirect + trusted origin; public `rawPost` does not expose those controls). The proxy's home redirect only checks cookie presence and is not an auth gate. Follow-ups (not done): stop returning raw tokens in the JSON body (BE-03), enable CSRF middleware (BE-04).
3. **Isomorphic cookie layer.** `getCookieValue` / `setCookieValue` (`src/lib/utils/cookie.ts`, `@/lib/utils`) switch between `js-cookie` and `next/headers`, so the same transport reporter logic runs in RSC/Server Action and browser. `setAuthSessionCookies` (`src/lib/utils/auth-session.ts`, `import "server-only"`) is excluded from the barrel so Client Components never pull in `next/headers`; Server Actions import `@/lib/utils/auth-session` directly.
4. **Token refresh mutex (per tab and across tabs).** Concurrent eligible browser requests share one module-scoped refresh promise (`refreshBrowserSession`) whose request runs under a cross-tab Web Lock (`navigator.locks`, name `mycourse:auth-refresh`; released when the refresh settles; unlocked fallback when the API is missing) so two tabs of one browser never rotate the same refresh token at once; waiters share success or failure and a waiter abort does not cancel the shared refresh; server writable requests are request-scoped and use neither single-flight nor the lock; failure attaches a sanitized cause to the original `ApiHttpError`; the browser always targets an absolute same-origin URL (`window.location.origin + /api/auth/refresh`).
5. **SWR for the current user.** `useAuth` caches `GET /api/v1/me` (`shouldRetryOnError: false`, `revalidateOnFocus: true`), revalidates on mount everywhere except `/login`/`/signup` when the persisted `/me` cache is < 30 s old (details in `auth`). A failed `/me` (5xx, timeout, no connection, or a `401` whose refresh could not conclude) is an error, not a guest: `useMeOutage()` exposes it and gated screens render `MeOutagePage` instead of the sign-in state. `useMyInstructorApplication` deliberately does not revalidate on focus and exposes bootstrap-only `isLoading`.
6. **Zustand for UI state.** `/me` mirror (`useMeStore`), language (`useLanguageStore`), API errors, stream log and dashboard header override live in provider-free stores; the old auth-modal Zustand state is gone (login/signup is route-based, see `PAGES.md`).
7. **Unified stream pipeline.** BroadcastChannel/SSE/WebSocket/NDJSON share one ingest path (transport -> `normalizeInboundEnvelope` -> `useStreamEventsStore.push` (`last` + rolling `log`, max 100) -> `subscribeStreamEvents` -> hooks); `EventsStreamProvider` starts transports when env/config allows.
8. **API response envelope.** Every Go endpoint returns `{ code, message, data }`; `code === 0` is success. `ApiErrorCode` (`src/constants/api-error-code.ts`) mirrors `be/internal/shared/errors/errcode_codes.go` 1:1; success check `isApiSuccess()` (`src/lib/utils/api.ts`); user-facing errors only through `toastApiError` / `translateApiErrorCode`, never the BE `message`.

### Caching layer (temporarily disabled)

`src/api/cache.ts` implements a dual-layer cache (client IndexedDB, server in-process `Map`). The integration in `apiFetch` is commented out (`// TODO: re-enable`); the default baseline TTL is 1 s and callers can pass `caching: { ttlSeconds: N }` or `caching: false`.

---

## Environment Variables

Single authoritative table (README and `deploy.md` point here). `NEXT_PUBLIC_*` are **inlined at `next build`**: they must reach whatever runs the build (the CI `build` job via GitHub Secrets/Variables, or Docker build-args) and need a rebuild after a change; setting them only in the PM2/container runtime env has no effect on the browser bundle. `SITE_URL` is the reverse: runtime-only.

| Variable | Required | Set at | Description |
|----------|----------|--------|-------------|
| `NEXT_PUBLIC_API_URL` | **Yes** | Build + runtime | Public Go API base URL, no trailing slash; must match BE `CORS_ALLOWED_ORIGINS`. Also read server-side. |
| `AUTH_COOKIE_DOMAIN` | Prod recommended | Server runtime (Server Actions) | Parent domain for auth cookies when FE and API are on separate subdomains (e.g. `yourdomain.net`); passed to `getCookieDomain()` -> `buildCookieOptions()`; leave unset on localhost. Must equal the BE value. |
| `API_URL` | No | Server runtime | Server-side fallback for the API base URL (pure SSR, private network routing); never in the client bundle. |
| `SITE_URL` | **Yes** (every `next start`) | Server runtime only | Canonical frontend origin (rules in `seo-web`): pure `https` origin, non-loopback in production; `http://localhost[:port]` / `http://127.0.0.1[:port]` only outside production. Not read at build; validated at server start (logs and exits 1 if invalid). Same host as the OAuth callbacks' origin. Supplied through the per-environment env file (`.env.local`, `.env.staging`, `.env.prod`; PM2 `env_file`, Docker `env_file`). |
| `NEXT_PUBLIC_STREAM_SSE_URL` | No | Build | SSE endpoint; empty disables SSE |
| `NEXT_PUBLIC_STREAM_WS_URL` | No | Build | WebSocket URL (`wss://...`); empty disables WS |
| `NEXT_PUBLIC_STREAM_GRPC_BASE_URL` | No | Build | NDJSON stream base URL (`/v1/events/stream` appended); empty disables it |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | For Google login | Build | Google Identity Services client id; must be present at build time, otherwise the Google button throws FE-local `4020`; empty disables the Google button + One Tap |
| `NEXT_PUBLIC_DISCORD_CLIENT_ID` | For Discord login | Build | Discord OAuth2 client id; empty disables the Discord button |
| `NEXT_PUBLIC_DISCORD_CALLBACK_URL` | For Discord login | Build | Absolute redirect URL `<origin>/auth/discord/callback`; byte-for-byte equal to BE `DISCORD_CALLBACK_URL` |
| `NEXT_PUBLIC_X_CLIENT_ID` / `NEXT_PUBLIC_X_CALLBACK_URL` | For X login (retained) | Build | X OAuth2 client id / redirect URL (`<origin>/auth/x/callback`, equal to BE `X_CALLBACK_URL`); X code retained, not wired to the popup |
| `NEXT_PUBLIC_PDF_WORKER_URL` | No | Build | Optional PDF.js worker URL override (HTTPS, CORS); default jsDelivr URL built from the installed `pdfjs-dist` version |

---

## Internationalization

| File | Role |
|------|------|
| `src/i18n/routing.ts` | `defineRouting`: locales `["en","vi"]`, `defaultLocale: "vi"`, `localePrefix: "always"` |
| `src/i18n/request.ts` | `getRequestConfig`: `loadMessages(locale)`; dev calls `preloadAllMessages()` once per process |
| `src/i18n/navigation.ts` | Typed `Link`, `redirect`, `useRouter`, `usePathname` |
| `src/lib/i18n/load-messages.ts` | `loadMessages`, `preloadAllMessages` (memoized), dynamic import of `@/messages/en` / `vi` |
| `src/messages/{en,vi}.ts` | Copy; `vi.ts` is the default locale and `satisfies Messages` (`types.ts`); `error-codes.ts` holds `errors.codes.{code}` |
| `src/types/i18n.d.ts` | `AppConfig.Messages` augmentation for typed `useTranslations` keys |

Rules: all user-visible text goes through `useTranslations` (client) / `getTranslations` (server); add every string to **both** `en.ts` and `vi.ts`; never import locale lists, use `routing` (`const { locales, defaultLocale } = routing`); always use the typed wrappers from `@/i18n/navigation`, never `next/link` (breaks locale routing); UI i18n is `en`/`vi` only (no `messages/ja.ts`, no `ja` routing). UI chrome comes from `useTranslations`; data/content locale comes from `useLocale()` passed as the API query `locale` (taxonomy list/picker names, instructor chips); do not invent a second FE locale store for reads. Two error namespaces, never mixed: API failure => `errors.codes.{code}` (`tErrors("4004")`), form validation => `{module}.validation.*` (`tValidation("title")`). Server components resolve language with `resolveCustomLanguage(await getLocale())`; client components read `useCustomLanguage()` (`languageCode`, `locale`, `languageLabel`) fed once by `LanguageLocaleSync`. `LocaleSwitcher` links must use `usePathname()` as `href` (never hard-code `href="/"`).

---

## Development server

`npm run dev` runs Next.js 16 Turbopack. Settings in `next.config.ts`: `turbopack.root` = app directory (prevents tracing sibling repos in a multi-root workspace); `turbopack.resolveAlias.canvas` = `src/lib/stubs/canvas.ts` (stubs optional Node `canvas` from `pdfjs-dist` so production builds succeed); `experimental.turbopackMemoryLimit` 4 GiB; `experimental.turbopackFileSystemCacheForDev` `false` (avoids unbounded `.next/dev/cache/turbopack` growth; trade-off: slightly slower cold compile, stable CPU/RAM/disk); `logging.browserToTerminal` `false`. Maintenance scripts: `npm run clean:next` (`rm -rf .next`), `npm run dev:clean` (`clean:next` then `next dev`, for CPU/RAM spikes after long sessions). Parallel-slot route changes need a dev-server restart. Quality gates and CI: see [`quality.md`](quality.md) and [`testing.md`](testing.md); the local gate is `npm run check-all` (`test-all` plus `build`); CI on `dev` runs `npm run test-all` in the `test` job, then `npm run build`.

---

## Conventions

### Files and components

| Type | Convention | Example |
|------|-----------|---------|
| React components | `kebab-case.tsx`, `PascalCase` named export | `auth-layout.tsx` |
| Hooks | `use-kebab-case.ts` | `use-auth-store.ts` |
| Utilities, type files, schema files | `kebab-case.ts` | `cookie.ts`, `api.ts` |
| Barrel files | always `index.ts` | `src/api/index.ts` |
| Server Actions | `kebab-case.ts` in `src/actions/<domain>/` | `auth.ts` |

Default to Server Components; add `"use client"` only for hooks (`useState`, `useEffect`, SWR, Zustand), event handlers, Radix interactive primitives and `useTranslations`; keep `getTranslations` and async data fetching on the server. Styling: `cn()` from `@/lib/utils` for conditionals, no inline `style={{}}` for layout, Tailwind class order layout -> spacing -> sizing -> typography -> color -> effects; scrollable containers use the `scrollbar-app` utility (`src/app/utils.css`, 4 px gray scrollbar). Libraries that touch `document` at import (e.g. `quill`) never use a top-level `import Quill from "quill"`: `import type Quill` for refs, `await ensureQuillLoaded()` from `@/lib/quill` inside `useEffect`, helpers call `getQuill()` afterwards (keeps `@/components/shared` barrel exports safe during SSR). `JsonLd` lives under `src/lib/seo/` (not `components/`) so it does not count against Knip `files`.

### State management

| State type | Tool | Example |
|------------|------|---------|
| Server data (async, cached) | SWR | `useAuth`, `useCourses` |
| Global UI state (sync) | Zustand (no Provider; import directly) | `useMeStore`, `useLanguageStore`, `useApiError`, `useStreamEventsStore` |
| Realtime push | Events pipeline + hooks | `useWebSocketStreamEvent`, `useSseStreamEvent` |
| Local component state | `useState` | form open/close toggles |
| URL/navigation state | `useRouter` / `usePathname` | active nav item; login/signup modal (`@modal` + `next`) |

SWR keys are named constants defined once next to the caller (`getMeEndpointKey = "/api/v1/me"` in `auth-factory.ts`) and reused for `mutate(key)`.

**SearchableSelect (infinite list):** data layer `useApiInfiniteListQuery` (`useSWRInfinite` in `src/api/hooks/shared.ts`: merged `rows` with optional `getRowKey` dedupe, `loadMore`, `hasMore`, `mutate`/`retry`); UI wiring `useSearchablePaginatedOptions` (popover open state, debounced search to the SWR key (resets infinite `size` to 1), pinned `selectedLabel`, client `excludeValues`, fetch gated by `enabled && open`, `getRowKey: (item) => mapToOption(item).value`); presentational `SearchableSelect` (`Popover` + `Command`). Consumers pass `getPageKey(params)` using existing caller key builders (`getInstructorRosterListKey`, `getTaxonomyListKey`), never ad-hoc `fetchPage`; SWR uses `fetchPaginatedListByKey` on the canonical URL; close/reopen reuses the cache (`revalidateOnFocus: false`, `revalidateFirstPage: false`). Precedent: `useUserMultiSelectPickerState` + `useInstructorRosterCandidates`.

### Forms, validation and errors

All forms use `react-hook-form` + `zodResolver`; pass the react-hook-form `error` to the field component, never `t(errors.*.message)` in form shells (`t(undefined)` throws `MISSING_MESSAGE`). Standard flow: (1) define the Zod schema in `src/schema/<domain>/` with **i18n-key messages** (`z.string().email({ message: "validation.email" })`, never hard-coded text) and export the inferred type; (2) `useForm({ resolver: zodResolver(schema) })`; (3) `handleSubmit(onSubmit)`; (4) call a Server Action rather than the API directly for sensitive operations; (5) on `result.success` update UI / `mutate` SWR / navigate or close the modal, otherwise `translateApiErrorCode(tErrors, result.code)`, never `result.message`. Translate keys with `resolveValidationMessage(t, message)` (`src/lib/utils/validation-message.ts`; the translator is typed `(key: never) => string`, so pass the scoped `useTranslations(...)` result directly) for inline errors and `toastValidationError()` for pre-submit `safeParse` failures. Validation namespaces: `auth.validation.*`, `me.validation.*`, `media.validation.*`, `taxonomy.form.validation.*` (resolved via `useTranslations("taxonomy.form")` + `validation.*`), `instructor.validation.*`, `course.validation.*`. Use `FormField` (`RequiredLabel` + control + hint + `FieldError`) for labelled dialog fields; `RequiredLabel` + `FieldError` directly only where the layout differs (selects, `DeltaEditor`, `ImageFileField`, review textarea blocks).

**API errors:** never show the BE JSON `message`; resolve by numeric `code`: `toastApiError(tErrors, error)` in `catch` blocks and `translateApiErrorCode(tErrors, result.code)` for Server Action results; copy lives in `errors.codes.{code}` (`src/messages/error-codes.ts` -> `en.ts`/`vi.ts`); unknown codes fall back to `errors.codes.9999`; the BE has no taxonomy/course/instructor-specific numeric codes (they reuse shared `2xxx`/`3xxx`; media also `9011`-`9019`, incl. `R2BucketNotConfigured = 9019`); no per-module semantic keys (`auth.errors.emailAlreadyExists`). `toastApiError` is for a **mutation** failure (screen stays usable); for a **primary data-load** failure render `StatusErrorPage` using `classifyApiError(error)` (`unknown` falls back to the screen's generic state); do not toast a primary-load failure nor full-page a mutation failure (first consumer `editor-page.tsx`; variants in `dashboards-and-access`).

**Optional write-payload fields** use one rule (`src/lib/utils/payload.ts`): include an optional string/id in a create/update body only when non-blank and, on update, only when it differs from the persisted value: `omitWhenBlank`, `changedNonBlank(value, persisted)`, spread `payloadField(key, value)`; never hand-roll `trim()` / `value || undefined`. Consumers: `toCreateCoursePayload`, `toUpdateCourseBasicInfoPayload` (`preview_video_file_id`, `slug`), the taxonomy `prepare*SubmitPayload` builders (`image_file_id`, `slug`), sub-lesson `media_url`.

**Slug fields:** slugs (course, taxonomy root and per-node) are editable and independent of the name/title; reuse `SlugInput`/`SlugField`, `sanitizeSlugInput`, `SLUG_PATTERN`, `SLUG_MAX_LENGTH` (255), `isSlugAdjusted`, `requiredSlugField`/`optionalSlugField`, one `TaxonomyTreeNode` type, and `useSlugConflictFlow` for 409/3007 (`course-editor`, `taxonomy-admin`). The FE has no name-to-slug generator (the BE generates slugs); never add one.

**Paginated lists:** use `ApiListQueryParams` (`src/types/api.ts`) and `apiListQueryToRecord()` (`src/lib/utils/list-query.ts`) + `buildQueryParams`; domain filters alias or extend it (media adds `category`/`sort_order`; taxonomy keeps `sort_desc` and adds `search_by`, `search_value`, `locale`, `include_images`). Use `formatBytes()` for file sizes.

### UI patterns

- **DropdownMenu -> Dialog/AlertDialog (row actions):** `<DropdownMenu modal={false}>` (`CourseAdminTableActionsMenu`, `CourseOutlineRowActions`) + `DeferredDropdownMenuItem` (`onAction`) instead of raw `onClick`/inline `setTimeout`; `deferDropdownAction()` (`src/lib/utils/defer-dropdown-action.ts`) runs the callback on the next tick so the menu unmounts before the dialog mounts; without this Radix can leave `body { pointer-events: none }` and freeze the dashboard until reload. Reuse points: `CourseReviewRowActions`, `course-admin-all-page`, `course-admin-trash-page`.
- **Popover combobox inside Dialog:** a Dialog sets `body { pointer-events: none }` and a default portaled `PopoverContent` inherits it (list not scrollable/clickable). `PopoverContent` has `portal?: boolean` (default `true`); the taxonomy locale picker uses `portal={false}`. Do not change shared defaults; before editing `PopoverContent` grep importers (currently `TaxonomyLocaleTabsSection` + `SearchableSelect`; GitNexus `impact` may report 0 callers on a stale index, trust grep).
- **Stacked confirm dialogs:** `ConfirmActionDialog stacked` shares the parent's Dialog primitive family; two copies of `@radix-ui/react-focus-scope` cause a `RangeError` (nested dialogs).
- **Error boundary vs 404:** see [`PAGES.md`](PAGES.md).

### TypeScript

Strict mode, no `any`; `import type` for type-only imports; `@/` aliases only.

### Adding a new feature checklist

- Read the relevant [`FEATURES.md`](FEATURES.md) entry (and `PAGES.md` / `ARCHITECTURE.md` when the task crosses features or routes); check [`SHARED.md`](SHARED.md) before adding any utility, hook, type or component.
- Run `npx gitnexus analyze` when the index is stale; before a PR run `npm run check-all` (optionally `npm run fix:biome` first; CI `test` on `dev` runs `npm run test-all`).
- If the change touches a behavior in the [`testing.md`](testing.md) matrix, colocate a `*.test.ts(x)` and reuse `src/test-support/` helpers (`renderWithProviders`, `mock-app-router`, MSW `server`); never use `jest.mock()` (does not hoist under this project's `next/jest` transform).
- Placement: server data fetching in `src/api/callers/<domain>/`; SWR hooks in `src/api/hooks/<domain>/`; Server Actions in `src/actions/<domain>/`; Zustand stores in `src/store/`; API route constants in `src/constants/api-route.ts`; page routes in `src/constants/route.ts` with URLs built via `src/lib/navigation/routes.ts`; strings in both `en.ts` and `vi.ts`.
- Post-auth default destination is `defaultPostAuthHref`; `homeHref` only for the guest home, brand links, logout and canonical.
- After implementation update the touched entries in `docs/` (never a new file).

---

## API layer

### Layout

| Folder | Role |
|--------|------|
| `src/api/core/` | Xior-backed executor, Fetch policy/body/helpers/errors (`fetch-error.ts`, `fetch-helpers.ts`, `fetch-core-body.ts`, `fetch-core.ts`), `methods.ts` (`createApiMethods(transport)`), `raw-http.ts` |
| `src/api/xior/` | Exact-pinned Xior client factory: raw executor + authenticated request-scoped executors and lifecycle interceptors over Next.js Fetch; Xior plugins (retry, refresh, cache, dedupe, throttle, progress) are intentionally disabled |
| `src/api/transport/` | `api-transport.ts` (`createApiTransport`, injectable reporter, no Zustand) + `browser-api-methods.ts` (`browserApiMethods` + Zustand reporter install) |
| `src/api/auth/` | `auth-refresh.ts` (eligibility, `validateRotatedTokens`, exact envelopes), `auth-runtime.ts` (adapter types), `refresh-upstream-raw.ts`, `browser-auth.ts` (single-flight), `server-auth.ts` (`server-only`, `createWritableServerApiMethods`) |
| `src/api/server/` | `cache-policy.ts` (endpoint-bound public cache registry, empty) + `server-raw-http.ts` (`serverRawFetch`: no auth cookies/signal/credentials) |
| `src/api/callers/<domain>/` | `create*Callers` in `*-factory.ts` (isomorphic, **no** `browserApiMethods`/Zustand) + `*-browser.ts` (browser singletons); **Server Actions import the `*-factory` path only**, never a module that evaluates browser bindings |
| `src/api/hooks/<domain>/` | SWR hooks (`shared.ts` holds `useApiRowsQuery`, `useApiListQuery`, `useApiDetailQuery`, `useApiInfiniteListQuery`) |

Prefer `@/api/...` paths under `core/`, `transport/`, `auth/`, `server/`; app code may use the `@/api` barrel for `api*` / `raw*` / errors. Canonical single-owner files stay separate inside these folders; do not inline them for line-budget.

### Contracts

- Never hard-code API paths: use `API_PUBLIC_ROUTES` / `API_PRIVATE_ROUTES` (`src/constants/api-route.ts`); add a constant for each new endpoint. Base URL from `NEXT_PUBLIC_API_URL` (or `API_URL` server-side); never hard-code.
- Response envelope `ApiResponse<T> { code: number; message: string; data: T }` (`code 0` = success, `data` null on error); low-level return `ApiResult<T> { data, statusCode, headers, cookies }`; paginated data returns `ApiPageInfo { page, per_page, total_items, total_pages }` (`data.result` + `data.page_info`).
- Call methods (import from `@/api`): `apiFetch`, `apiPost`, `apiPut`, `apiDelete`, `apiOptions` (+ six `raw*`). Check both layers: `catch` for transport/HTTP failure (`ApiHttpError` / `ApiTransportError`) and `data.code !== 0` for business failure. Never call native `fetch` for MyCourse API routes (it bypasses auth refresh and error reporting).
- Authenticated defaults: `cache: "no-store"` on browser and server, timeout **10 s** (per-request `options.timeout` in ms, e.g. media upload 30 s); optional mutation `compress?: boolean` (default false; gzip JSON POST/PUT/PATCH once into a replayable body shared by refresh retry and redirect hops; sets `Content-Encoding: gzip`, removes `Content-Length`; compression starts only after the abort/timeout lifecycle is armed; FormData/GET/DELETE/OPTIONS never compressed; no production caller sets it yet because the BE does not decompress gzip). Authenticated headers are attached automatically; never set `Authorization` manually.
- `fetch-core`: orchestration `prepareFetchCoreRequest` -> `dispatchFetchResponse` -> `readResponseData` -> `toFetchCoreOutcome`; timeout/abort through body-read; overall redirect deadline; trusted-origin redirect loop (`followServerRedirects`, 301/302/303/307/308 only, awaits intermediate body `cancel()`); redirect TypeError classification only in `classifyFetchFailure`; project query encoding and replayable-body construction stay policy owners (stricter than Xior's generic encoder).
- `serverRawFetch` = `assertServerRawFetchOptions` + `resolveServerRawCacheOptions` + `executeFetchCore`; `rawPostRefreshUpstream` hard-codes `redirect: "error"` + `resolveTrustedOrigin(baseURL)` and is used by the BFF route and `refreshUpstreamSession`; error parsing is `parseApiErrorEnvelope` / `throwApiPolicyError` in `core/fetch-error.ts`.
- Raw helpers (`rawFetch` / `rawPost` / ...): public options `headers`, `cookies`, `params`, `timeout`, `withCredentials`, `baseURL`, `signal`, optional `cache?: RequestCache` honored only for raw GET (omitted: browser GET omits the Fetch cache, server GET `no-store`; POST/PUT/PATCH/DELETE/OPTIONS always `no-store`); `force-cache` is an opt-in browser cache mode, **not** a 30 s TTL (exact TTL needs `Cache-Control: max-age`, an app Cache Storage timestamp, or Next `revalidate` via `serverRawFetch` profiles); no public `redirect`/`trustedOrigin`. Use `raw*` only for refresh and third-party URLs (`remote-data.ts`, `wikidata-company.ts`), never for private MyCourse routes.
- Do not use: direct `fetch`/third-party HTTP for the MyCourse API; hard-coded paths; manual `Authorization`; `response.message` in UI; semantic per-module error keys for API errors.
- Server redirect/SEO fetch: `seoFetch` is unused (see `seo-web`); `refreshBrowserSession` has no `AbortSignal` parameter (public authenticated options omit signal; adapter single-flight only).

### Global SWR defaults and hook rules

`AppProviders` wraps the tree in `SWRConfig` with `src/constants/swr.ts` defaults and `provider: meCacheProvider`: `revalidateOnFocus: false`, `dedupingInterval: 30_000`, `errorRetryInterval: 180_000` (3 min instead of SWR's 5 s), client-only singleton cache that persists only `/me` to `sessionStorage`. Hooks may override: `useAuth` (focus on, no error retry, scoped on-mount skip), `useMyInstructorApplication` (no focus, no retry, bootstrap-only `isLoading`); hooks that omit `shouldRetryOnError: false` retry at the 3-minute interval. A new hook: named key constant, fetcher in `src/api/callers/<domain>/<domain>.ts`, hook in `src/api/hooks/<domain>/use<Domain>.ts`.

### Error reporting

`reportApiError` (`src/api/transport/api-transport.ts`) must not log or store the BE body `message`, tokens, cookies, session ids, Authorization headers or sensitive bodies; for `ApiHttpError` it builds FE-owned copy from status (+ `appCode`) and keeps the raw body only on `ApiHttpError.response.data` for code mappers. Reporter matrix (no env flag): **expected** (never custom Console, never Zustand): guest `GET /api/v1/me` 401, `ERR_BLOCKED_BY_CLIENT`, `ApiRefreshRequiredError`; **logged**: other 4xx, 5xx, `ApiTimeoutError`, `ApiAbortError`, `ApiNetworkError` (non-blocked), `ApiResponseParseError`, `ApiPolicyError`, `ApiRequestReplayError`; custom `[API]` Console only when `isServer()` OR `NODE_ENV === "development"` (production browser prints none: guest homepage => 0 custom lines); Zustand `useApiError` push is browser-only for the logged set (last 20 entries); do not blanket-skip status < 500. `toastApiError` uses the numeric `code` -> i18n, development may `console.debug({ code, message })`. The browser refresh BFF maps upstream `ApiTimeoutError` to **504** and other network failures to **502** (classify with `instanceof`, never regex on `error.message`; a safe substring is allowed only for blocked-by-client detection) and answers with allowlisted codes + fixed safe messages. `parseMaxAgeForCookie`: Max-Age digits must end at `;`, whitespace or end-of-attribute, otherwise `undefined` (fail closed). Do not silence a bad navigation by hiding console output: prevent the missing-route `Link`/prefetch instead.

Feature-specific endpoint lists live in the matching [`FEATURES.md`](FEATURES.md) entry (`API:` line); the generic per-call patterns above apply to all of them.
