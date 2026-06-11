# Folder Structure (`fe-mycourse`)

_Last audited: 2026-06-08 (validation schemas, api-error utils, error-codes messages)._


Full directory tree with purpose of every folder. Keep this file updated whenever folders are added, moved, or removed.

---

## Root

```
fe-mycourse/
├── src/                    # All application source code
├── public/                 # Static assets served as-is (images, icons, favicons)
├── docs/                   # Project documentation (this folder)
├── node_modules/           # npm dependencies (not committed)
├── next.config.ts          # Next.js configuration (next-intl plugin, env)
├── components.json         # shadcn/ui configuration
├── biome.json              # Biome linter/formatter configuration
├── eslint.config.mjs       # ESLint: Next.js + src/constants/** + src/types/** rules (see docs/quality.md)
├── commitlint.config.cjs    # Conventional Commits lint configuration
├── tsconfig.json           # TypeScript compiler options (strict mode, path aliases)
├── tailwind.config.ts      # Tailwind CSS configuration (if present)
├── postcss.config.mjs      # PostCSS configuration (@tailwindcss/postcss)
├── package.json            # Project dependencies and npm scripts
├── ecosystem.config.cjs    # PM2 apps: mycourse-web-dev / staging / prod
├── .github/workflows/      # CI: enforce-main-from-dev.yml, deploy-dev.yml (test → build → deploy)
├── .jscpd.json             # jscpd config (npm run dupl); ignores src/components/ui/** (shadcn upstream)
├── .jscpd-report/          # jscpd JSON reports (gitignored)
└── README.md               # Project overview and quick-start guide
```

---

## `src/` — Application Source

### `src/app/` — Next.js App Router

Entry point for all routing. Every folder corresponds to a URL segment.

```
src/app/
├── layout.tsx              # Root layout: loads fonts (Roboto, Gilroy, GeistMono), mounts Sonner <Toaster>
├── page.tsx                # Root page: immediately redirects browser to /vi (default locale)
├── not-found.tsx           # Global 404: NextIntlClientProvider + AppProviders + NotFoundPage
├── globals.css             # Global CSS resets and Tailwind base imports
├── utils.css               # Utility CSS classes shared across layouts
├── favicon.ico             # Browser tab favicon
└── [locale]/               # Dynamic locale segment — value: "en" | "vi"
    ├── layout.tsx          # Locale layout: wraps in NextIntlClientProvider + AppProviders
    ├── not-found.tsx       # Locale-level 404 → NotFoundPage (inherits providers from layout)
    ├── (web)/              # Route group: public marketing pages (no prefix in URL)
    │   ├── layout.tsx      # Web shell: Header + <main> + Footer
    │   ├── not-found.tsx   # Web 404 → NotFoundPage showHeader={false}
    │   ├── page.tsx        # Home → HomePage
    │   ├── confirm-email/page.tsx
    │   └── logout/page.tsx
    ├── admin/              # Admin dashboard (RoleDashboardLayout -> DashboardLayout)
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── courses/page.tsx    # Admin course review queue
    │   ├── taxonomy/       # App routes → shared TaxonomyListPage (resourceKey per route)
    │   └── instructors/    # App routes → shared instructor screens
    ├── instructor/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── courses/
    │   │   ├── page.tsx        # InstructorCoursesPage
    │   │   └── [courseId]/
    │   │       ├── info/page.tsx
    │   │       ├── outline/page.tsx
    │   │       ├── collaborators/page.tsx
    │   │       ├── pricing/page.tsx
    │   │       └── certificate/page.tsx
    │   └── tickets/page.tsx
    └── sysadmin/
        ├── layout.tsx
        ├── page.tsx
        ├── courses/page.tsx    # System-admin course review queue
        ├── taxonomy/       # App routes → shared TaxonomyListPage (resourceKey per route)
        └── instructors/    # same five shared screens as admin
```

### `src/screen/` — Page-Level Screen Components

Async server components that assemble sections into a full page. Acts as the bridge between App Router pages and feature components.

```
src/screen/
├── index.ts                # Barrel: re-exports common, admin, instructor, sysadmin
├── common/
│   ├── index.ts            # Barrel: shared screens (home, taxonomy, instructor, course)
│   ├── course/
│   │   ├── index.ts
│   │   └── course-review-page.tsx  # Shared admin/sysadmin course review queue
│   ├── instructor/
│   │   ├── index.ts
│   │   ├── instructor-roster-page.tsx
│   │   ├── instructor-approvals-page.tsx
│   │   ├── instructor-profiles-page.tsx
│   │   ├── instructor-expertise-page.tsx
│   │   └── instructor-tickets-admin-page.tsx
│   ├── home/
│   │   └── page.tsx        # HomePage — assembles all home section components
│   ├── not-found/
│   │   ├── index.ts
│   │   └── not-found-page.tsx  # NotFoundPage — localized 404 (image, i18n copy, CTA)
│   └── taxonomy/
│       ├── index.ts
│       └── taxonomy-list-page.tsx  # TaxonomyListPage (client CRUD list, formDialogKey remount, shared by admin + sysadmin)
├── admin/
│   ├── index.ts
│   └── page.tsx            # AdminDashboardPage (placeholder)
├── instructor/
│   ├── index.ts
│   ├── page.tsx            # InstructorDashboardPage (placeholder)
│   ├── courses/
│   │   ├── page.tsx        # InstructorCoursesPage
│   │   └── editor-page.tsx
│   └── tickets/page.tsx    # InstructorTicketsPage
└── sysadmin/
    ├── index.ts
    └── page.tsx            # SysadminDashboardPage (placeholder)
```

### `src/components/` — React Components

Organized by reusability and domain.

```
src/components/
├── ui/                     # shadcn/Radix UI primitives (Button, Dialog, Input, Avatar, Badge, Card, …)
│                           # Generated by shadcn CLI — do not hand-edit structural logic
├── common/                 # Layout-level components shared across all pages
│   ├── index.ts            # Barrel: re-exports auth-menu, dashboard, footer, header
│   ├── dashboard/          # dashboard-layout.tsx, role-dashboard-layout.tsx, DashboardSidebar, DashboardUnauthorized
│   ├── header/             # header.tsx, header-dashboard, browse-nav, browse-sidebar-menu, header-mobile-bar, header-mobile-sidebar,
│   │                       # sidebar-auth-footer, locale-switcher, index.ts
│   │                       # index barrel: browse-nav, header, header-mobile-bar, header-mobile-sidebar, sidebar-auth-footer
│   │                       # direct imports only: browse-sidebar-menu, locale-switcher
│   ├── footer/             # Footer (RSC), FooterSocial (client social icons row)
│   └── auth-menu/          # Full authentication UI cluster:
│                           #   AuthLayout, AuthButton, LoginSignupPopup, user-menu-dropdown-items,
│                           #   LoginContent, SignupContent, UserMenu,
│                           #   auth/auth-form-fields.tsx (Zod i18n validation translate),
│                           #   auth-social-login/ (social auth buttons)
├── home/                   # Home page section components
│                           #   HeroSection, SearchSection, TopCoursesSection,
│                           #   AdvancedPromoSection, TrendingCoursesSection,
│                           #   UpcomingWebinarsSection, PromoSection, CourseCard
├── features/
│   ├── course/             # CourseStatusBadge, CourseBasicInfoTab,
│   │                       # CourseOutlineTab, CourseCollaboratorsTab, Course*Dialog helpers
│   │                       # grouped tab prop objects (`state` / `data|taxonomyRows` / `actions`)
│   ├── taxonomy/           # TaxonomyFormDialog (mount init from initialData; persistedSlug slug preview), tree/description editors, taxonomy-table-columns, taxonomy-tree-view-button
│   ├── instructor/         # InstructorProfileViewDialog, ConfirmAddInstructorDialog, InstructorApprovalActions,
│   │                       # InstructorListPagination, instructor action/footer helpers,
│   │                       # shared instructor course editor route adapter for app pages
│   └── media/              # MediaCollectionDialog, MediaUploadDialog, MediaItemCard, MediaTabPanel
├── shared/                 # Cross-feature presentational components
│                           #   PermissionGate, ConfirmDeleteDialog, DagreTreeDialog, DataTable,
│                           #   DeltaEditor, DeltaViewer, SortableList,
│                           #   SortableTreeEditor,
│                           #   SearchBar (stub), ImageFileField
├── providers/
│   └── app-providers.tsx   # SWRConfig + EventsStreamProvider
│                           # + MeSwrSync (useSyncMeFromAuth)
│                           # + LanguageLocaleSync (useSyncLanguageFromLocale)
│                           # + AuthConfirmTabSync / AuthLogoutTabSync + children
└── demo/
    └── register-form.tsx   # Sandbox/demo form — not wired to any route
```

### `src/actions/` — Next.js Server Actions

Functions marked `"use server"` — execute on the server, called from client components.

```
src/actions/
└── auth/
    ├── auth.ts             # loginAction, registerAction, confirmAction, logoutAction
    │                       # signupAction: deprecated alias of registerAction
    └── auth-client.ts      # handleAuthSubmit() for client forms; delegates to server actions
```

### `src/api/` — HTTP Client Layer

All communication with the Go backend API.

```
src/api/
├── index.ts                # Barrel: re-exports api*, raw*, types from all sub-modules
├── instance.ts             # createApiInstance() — Axios instance + interceptors
│                           #   Request: attach Authorization: Bearer <access_token>
│                           #   Response: token refresh mutex, error reporting
├── axios-helpers.ts        # normalizeHeaders, parseSetCookies, buildAxiosConfigWithCookies (methods + raw-http)
├── methods.ts              # apiFetch / apiPost / apiPut / apiPatch / apiDelete / apiOptions → ApiResult<T>
├── raw-http.ts             # rawFetch / rawPost / … plain Axios (used by doTokenRefresh only)
├── cache.ts                # Dual-layer cache (IndexedDB + Map) — implemented but currently not wired in methods.ts
├── callers/
│   ├── auth/
│   │   └── auth.ts         # auth + Me API: getMe/patchMe/deleteMe/getMyPermissions, getMeEndpointKey
│   ├── taxonomy/
│   │   └── taxonomy.ts     # list/create/patch/delete taxonomy services
│   ├── instructor/
│   │   └── instructor.ts   # roster, applications, profiles, expertise, tickets
│   ├── course/
│   │   └── course.ts       # course list/detail, draft review, outline CRUD/reorder, leases, learner progress
│   └── media/
│       └── media.ts        # list/upload/delete media services
└── hooks/
    ├── shared.ts          # useApiListQuery / useApiRowsQuery / useApiDetailQuery
    ├── auth/
    │   └── useAuth.ts      # SWR hook: { me, isLoading, error, errorCode, mutate }
    ├── taxonomy/
    │   └── useTaxonomy.ts  # useTaxonomyList(resourceKey, filters)
    ├── instructor/
    │   └── useInstructor*.ts  # roster, applications, profiles, expertise, tickets
    ├── course/
    │   └── useCourses.ts      # editable course list/detail, review queue, learner course hooks
    └── media/
        └── useMediaFiles.ts # useMediaFiles(filters)
```

### `src/store/` — Global State (Zustand)

Provider-free stores. Any component can import and use without a wrapping Provider.

```
src/store/
├── auth/
│   └── auth.ts             # useAuthStore: modal state (authAction: "none"|"login"|"signup"|"logout", nextLink)
├── language/
│   └── language-store.ts   # useLanguageStore: languageCode, locale, languageLabel + setFromLocale
├── api-error-store.ts      # useApiError: global error accumulation (last 20 API errors)
├── use-app-store.ts        # useAppStore: app-level placeholder store
└── events/
    ├── index.ts            # Barrel: stream + per-channel selectors
    ├── stream-events-store.ts  # useStreamEventsStore: clientSeq, last, log (max 100)
    ├── broadcast/index.ts  # useLastBroadcastStreamEvent()
    ├── sse/index.ts        # useLastSseStreamEvent()
    ├── socket/index.ts     # useLastWebSocketStreamEvent()
    └── gRPC/index.ts       # useLastGrpcStreamEvent()
```

### `src/hooks/` — Custom React Hooks

```
src/hooks/
├── auth/
│   ├── index.ts            # Barrel: use-auth-store, use-permissions, tab-sync hooks
│   ├── use-auth-store.ts   # useAuthStore (re-export), useGetMe, useSyncMeFromAuth
│   ├── use-permissions.ts  # usePermissionSet, useHas*, useSatisfiesPermissions, useFilteredUserMenuGroups
│   ├── use-auth-confirm-tab-sync.ts
│   └── use-auth-logout-tab-sync.ts
├── course/
│   ├── index.ts            # Barrel: use-course-editor-state, use-course-outline-reorder
│   ├── use-course-editor-state.ts  # Course editor state, lease handling, translated toasts
│   └── use-course-outline-reorder.ts  # Optimistic outline reorder (SWR patch + reorder API)
├── events/
│   ├── index.ts            # Barrel: useStreamEvent + per-channel hooks
│   ├── use-stream-event.ts # subscribeStreamEvents + optional source/type filter
│   ├── broadcast/          # useBroadcastStreamEvent, useSendBroadcastOutbound
│   ├── sse/                # useSseStreamEvent
│   ├── socket/             # useWebSocketStreamEvent
│   └── gRPC/               # useGrpcStreamEvent
├── language/
│   ├── index.ts            # useCustomLanguage, useSyncLanguageFromLocale
│   ├── use-custom-language.ts
│   └── use-sync-language-from-locale.ts
├── quill/
│   ├── index.ts            # useDeltaEditorMediaHandlers
│   └── use-delta-editor-media-handlers.ts
└── use-mobile.ts           # useIsMobile
```

### `src/events/` — Realtime Stream Transports

Client-side ingest pipeline (BroadcastChannel, SSE, WebSocket, NDJSON gRPC). See [`delivery.md`](./delivery.md).

```
src/events/
├── index.ts                # Barrel: transports, post*Outbound, EventsStreamProvider
├── providers/
│   └── events-stream-provider.tsx  # useEffect → startStreamEventTransports()
├── registry/
│   └── start-stream-transports.ts  # Starts enabled transports; returns cleanup
├── core/
│   ├── publish.ts          # publishRawStreamPayload → normalize + store + emit
│   ├── normalize-inbound.ts    # Zod envelope + per-(source,type) payload
│   ├── subscribe.ts        # subscribeStreamEvents / emitStreamEventToSubscribers
│   ├── outbound-metadata.ts    # nextStreamOutboundMetadata()
│   ├── event-code.ts       # makeStreamEventCode(source, type)
│   └── join-url.ts         # joinBaseUrlAndPath (gRPC stream URL)
├── broadcast/
│   └── broadcast-transport.ts    # BroadcastChannel listen + postBroadcastOutbound
├── sse/
│   └── sse-transport.ts    # @microsoft/fetch-event-source
├── socket/
│   └── socket-transport.ts # reconnecting-websocket + auto pong on ping
└── gRPC/
    └── grpc-transport.ts   # fetch NDJSON GET stream
```

### `src/types/` — TypeScript Type Definitions

**ESLint:** type-only — no runtime values, functions, or `export *` (use `export type *`). Value imports from `@/constants/**` are allowed when deriving types (e.g. `ApiErrorCodeValue`). See [`docs/quality.md`](./quality.md#eslint-eslintconfigmjs).

```
src/types/
├── api.ts                  # ApiResult, ApiResponse, ApiPageInfo, ApiListQueryParams, ApiEntityStatus, ApiErrorCodeValue
├── taxonomy/
│   └── index.ts            # Taxonomy entities, config types; TaxonomyListFilters (= ApiListQueryParams + search_by/search_value)
├── media/
│   └── index.ts            # MediaFile, MediaTab, MediaListFilters (= ApiListQueryParams + category/sort_order)
├── browse-menu.ts          # BrowseMenuItem (recursive children?: BrowseMenuItem[])
├── user-menu.ts            # UserMenuItem, UserMenuGroup, UserMenuStatus (+ PermissionRequirement, optional titleKey)
├── index.ts                # `export type *` barrel (domain types only)
├── auth/
│   ├── index.ts            # `export type * from "./auth"`
│   └── auth.ts             # MeResponse, LoginResponse, RefreshTokenResponse
├── permissions/
│   └── index.ts            # PermissionName, PermissionId, PermissionRequirement (types only)
└── events/
    ├── index.ts            # Barrel: stream-events + per-channel types
    ├── common.ts           # StreamEventSource, metadata, StreamInboundEventOf, StreamOutboundEventOf
    ├── payloads.ts         # Shared payloads + StreamChannelEventMap, WebSocket/SSE maps
    ├── stream-events.ts    # StreamEvent, StreamOutboundEvent unions
    ├── broadcast/index.ts
    ├── sse/index.ts
    ├── socket/index.ts
    └── gRPC/index.ts
```

### `src/schema/` — Zod Validation Schemas

```
src/schema/
├── index.ts                # Barrel: auth, me, media, taxonomy, instructor, course
├── auth/auth.ts            # loginSchema, signupSchema (auth.validation.*)
├── me/me.ts                # updateMeSchema (avatar_file_id optional UUID)
├── media/media.ts          # upload batch rules (media.validation.*)
├── taxonomy/taxonomy.ts    # slug/status/topic/skill/outcome schemas
├── instructor/instructor.ts # email, rejection reason, expertise, ticket
└── course/course.ts        # create, section, lesson, sub-lesson, collaborator, reject
```

Error messages in schemas use **i18n keys** (not hardcoded strings). Resolve in components via `resolveValidationMessage` or auth-specific `resolveAuthValidationMessage`.

### `src/constants/` — Application Constants

**ESLint:** only plain values — no functions, types, or `.tsx` files. Helpers → `src/lib/utils/`; types → `src/types/`. See [`docs/quality.md`](./quality.md#eslint-eslintconfigmjs).

```
src/constants/
├── api-route.ts            # API_PUBLIC_ROUTES + API_PRIVATE_ROUTES (me, taxonomy, media, instructor, …)
├── api-error-code.ts       # ApiErrorCode — mirrors be/internal/shared/errors/errcode_codes.go
├── browse-menu.ts          # BROWSE_MENU_ITEMS — recursive category tree (Figma seed)
├── route.ts                # PUBLIC_ROUTES + PRIVATE_ROUTES + PUBLIC_RESOURCE_ROUTES + PRIVATE_RESOURCE_ROUTES (central FE navigation values)
├── common.ts               # HEADER_DROPDOWN_ITEMS, LANGUAGE_OPTIONS (user-menu config values incl. permissions/titleKey; roles group first)
├── permissions.ts          # PERMISSIONS — P1…P58 (mirror BE AllPermissions)
├── permission-ids.ts       # PERMISSION_IDS — P1…P58
├── roles.ts                # ROLES — sysadmin, admin, instructor, learner
├── dashboard/
│   ├── index.ts            # ADMIN_DASHBOARD_ITEMS, INSTRUCTOR_*, SYSADMIN_* (barrel)
│   ├── admin-items.ts      # Admin sidebar tree (includes taxonomy group + children)
│   ├── sysadmin-items.ts   # Sysadmin sidebar tree
│   ├── instructor-items.ts
│   ├── instructor-icons.ts # INSTRUCTOR_MENU_ICONS — Lucide icons for instructor nav nodes
│   └── taxonomy-icons.ts   # TAXONOMY_MENU_ICONS — Lucide icons for taxonomy nav nodes
├── instructor/
│   └── resources.ts        # INSTRUCTOR_GROUP_READ_PERMISSIONS (data only)
├── taxonomy/
│   └── resources.ts        # TAXONOMY_RESOURCES, TAXONOMY_RESOURCE_KEYS, TAXONOMY_GROUP_READ_PERMISSIONS (data only)
├── media/
│   └── file-rules.ts       # MEDIA_TAB_ACCEPT, MEDIA_COLLECTION_ALL_TABS, upload limits, extension lists
└── events/
    └── index.ts            # STREAM_EVENTS_LOG_MAX, STREAM_ENV_KEYS (SSE/WS/gRPC URLs)
```

### `src/lib/language/` — Locale resolution (no React Context)

```
src/lib/language/
└── resolve-language.ts     # AppLanguage type, resolveLanguageCode, resolveCustomLanguage
                            # Used by language store + optional RSC via getLocale()
```

### `src/lib/` — Shared Utilities and Core Helpers

```
src/lib/
├── navigation/
│   ├── home.ts             # navigateToHome(router) helper for header/dashboard brand touchpoints
│   └── routes.ts           # route builders + shared href constants (public/private/resource)
├── quill/
│   ├── index.ts            # Barrel: DeltaEditor Quill blots, toolbar, paste/drop handlers
│   ├── delta-editor-quill.ts
│   └── delta-editor.css    # Quill font picker + embed remove styles (imported by delta-editor-quill.ts)
├── utils/                  # Shared helper functions — import as @/lib/utils
│   ├── index.ts            # Barrel: client-safe utils only (cn, url, cookie, …)
│   ├── cn.ts               # cn() — clsx + tailwind-merge class combiner
│   ├── url.ts              # buildQueryParams() — query string builder
│   ├── list-query.ts       # apiListQueryToRecord() — BE list filter → query record (taxonomy + media)
│   ├── api.ts              # isApiSuccess() — ApiResponse success type guard
│   ├── api-error.ts        # toastApiError, translateApiErrorCode, extractAxiosApiError
│   ├── validation-message.ts # resolveValidationMessage, toastValidationError, firstValidationMessageKey
│   ├── course-delta.ts       # Quill Delta parse/stringify/text helpers + countDeltaNonWhitespace
│   ├── course.ts             # createCourseBasicInfoState, createCourseSubLessonFormState, rootOutlineStableId, selectedIdsToMap
│   ├── format-bytes.ts     # formatBytes() — human-readable B/KB/MB/GB (upload UI, any file size display)
│   ├── media.ts            # isImageFilename, isExecutableExtension, validateMediaUploadBatch, isImageMedia, …
│   ├── dagre-tree.ts       # treeToFlowElements, getLayoutedElements (React Flow + dagre)
│   ├── taxonomy.ts         # getTaxonomyResourceConfig, getTaxonomySearchableColumns, getTaxonomyTreeFromEntity, buildTaxonomyDagreRoot, countTaxonomyTreeNodes
│   ├── slug.ts             # generateSlug() + slugifyName() — live slug normalization
│   ├── react.ts            # useUniqueId() — stable ID generator for accessibility
│   ├── user.ts             # pickCharacter() — avatar initial picker
│   ├── cookie.ts           # isomorphic getCookieValue / setCookieValue; buildCookieOptions
│   ├── permission.ts       # satisfiesPermissions, PERMISSION_NAME_TO_ID, filterPermissionNavTree, id lookup
│   ├── dashboard.ts        # filterDashboardItems (wraps filterPermissionNavTree)
│   └── auth-session.ts     # SERVER ONLY — setAuthSessionCookies (import directly, not via barrel)
├── font.ts                 # next/font definitions: Roboto, Gilroy, GeistMono
└── http.ts                 # Placeholder for future HTTP utilities
```

### `src/config/` — Runtime Configuration

```
src/config/
├── load-config.ts          # Dynamic config loader (extend for feature flags)
├── items/
│   └── items-config.ts     # Item/feature flag configuration
└── events/
    ├── index.ts            # Barrel: broadcast, sse, socket, gRPC configs
    ├── broadcast/index.ts  # BroadcastChannel name, enabled flag
    ├── sse/index.ts        # NEXT_PUBLIC_STREAM_SSE_URL
    ├── socket/index.ts     # NEXT_PUBLIC_STREAM_WS_URL
    └── gRPC/index.ts       # NEXT_PUBLIC_STREAM_GRPC_BASE_URL + streamPath
```

### `src/i18n/` — Internationalization Setup

```
src/i18n/
├── routing.ts              # defineRouting: locales ["en","vi"], defaultLocale "vi", localePrefix "always"
├── request.ts              # getRequestConfig: loadMessages(locale) via @/lib/i18n
└── navigation.ts           # Typed Link, redirect, useRouter, usePathname from next-intl/navigation
```

### `src/lib/i18n/` — Message loading

```
src/lib/i18n/
├── load-messages.ts        # loadMessages, preloadAllMessages — dynamic import en.ts / vi.ts
└── index.ts                # Barrel export
```

### `src/messages/` — Translation Files

```
src/messages/
├── en.ts                   # English translations (imports error-codes)
├── vi.ts                   # Vietnamese (satisfies Messages from types.ts)
├── error-codes.ts          # errors.codes.{code} copy (en + vi objects)
└── types.ts                # export type Messages
```

Global API error namespace: `errors.codes` (numeric string keys). Module validation namespaces: `auth.validation`, `me.validation`, `media.validation`, `taxonomy.form.validation`, `instructor.validation`, `course.validation`.

### `src/proxy.ts` — Next.js Middleware

```
src/proxy.ts                # next-intl middleware (createMiddleware(routing)) + config.matcher
                            # Next.js 16 uses src/proxy.ts for request proxy/middleware-style handling.
```

---

## `public/` — Static Assets

```
public/
└── ...                     # Icons, images, and other static files served at /
```

---

## `docs/` — Project Documentation

```
docs/
├── architecture.md         # Technology stack, directory map, design decisions, clusters
├── delivery.md             # Index: realtime channels (WS, SSE, gRPC, broadcast, …)
├── delivery/               # Per-channel delivery docs (required by project rules)
│   ├── broadcast.md
│   ├── websocket.md
│   ├── sse.md
│   ├── grpc.md
│   ├── graphql.md          # Not implemented
│   ├── mqtt.md             # Not implemented
│   └── long-polling.md     # Not implemented
├── deploy.md               # Production deployment runbook (PM2, Nginx, TLS, env vars)
├── flow.md                 # Execution flows: login, signup, token refresh, stream events
├── logic-flow.md           # Control-flow paths including stream ingest
├── screens.md              # App Router routes, layouts, UI surfaces
├── folder-structure.md     # This file
├── api-using.md            # Frontend API usage patterns and conventions
├── modules.md              # Module map (Ui, Auth, Api, Events, …)
├── components.md           # Component inventory and responsibilities
├── router.md               # Routing structure and navigation conventions
├── patterns.md             # Coding patterns and conventions
├── dependencies.md         # Key libraries and their roles
├── quality.md              # ESLint, Biome, Madge / jscpd; CI test job (quality:deps + lint + test)
└── reusable-assets.md      # Reusable utilities, types, hooks, and constants
```
