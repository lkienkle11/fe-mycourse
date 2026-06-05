# Modules (`fe-mycourse`)

_Last audited: 2026-06-05 (course collaboration + review queue)._


## Module map
- `Ui`: `src/components`, `src/screen`, `src/app/[locale]/(web)`, `src/app/[locale]/{admin,instructor,sysadmin}` (dashboard shells)
- `Auth`: `src/actions/auth`, `src/components/common/auth-menu`, `src/schema/auth`, `src/types/auth`
- `Api`: `src/api`, `src/constants/api-route.ts`, `src/constants/api-error-code.ts`, `src/types/api.ts`, `src/lib/utils/api.ts`
- `Events`: `src/events`, `src/hooks/events`, `src/store/events`, `src/types/events`, `src/config/events`
- `State`: `src/store` (auth, language, api-error, events), `src/hooks/auth`, `src/hooks/language`
- `Routing + i18n`: `src/app`, `src/i18n`, `src/proxy.ts`, `src/messages`
- `Shared`: `src/lib/utils`, `src/constants`, `src/config`
- `Taxonomy`: `src/types/taxonomy`, `src/constants/taxonomy`, `src/api/callers/taxonomy`, `src/components/features/taxonomy`, `src/screen/common/taxonomy`, `src/screen/{admin,sysadmin}/taxonomy/*`, app routes under `admin/taxonomy/*` and `sysadmin/taxonomy/*`
- `Media`: `src/types/media`, `src/constants/media`, `src/api/callers/media`, `src/components/features/media` (collection popup; no dedicated route page yet)
- `Instructor`: `src/types/instructor.ts`, `src/constants/instructor`, `src/api/callers/instructor`, `src/api/hooks/instructor`, `src/components/features/instructor`, `src/screen/common/instructor`, `src/screen/{admin,sysadmin}/instructor/*`, `src/screen/instructor/tickets`, app routes under `admin/instructors/*`, `sysadmin/instructors/*`, `instructor/tickets`
- `Course`: `src/types/course.ts`, `src/api/callers/course`, `src/api/hooks/course`, `src/components/features/course`, `src/screen/instructor/courses`, `src/screen/common/course`, app routes under `instructor/courses/*`, `admin/courses`, `sysadmin/courses`

## Responsibilities
- `Ui` renders pages/sections and calls hooks/actions.
- `Auth` handles login/signup flows and auth modal behavior.
- `Api` centralizes HTTP transport, retries, and endpoint access.
- `Events` manages realtime transports (BroadcastChannel, SSE, WebSocket, NDJSON gRPC), normalization, and hook subscriptions.
- `State` stores auth modal state, `/me` sync, **language** (`useLanguageStore`), API errors, and stream event log.
- `Routing + i18n` controls locale-prefixed navigation and message loading.
- `Shared` exposes reusable helpers/types/constants (`lib/language`, `constants/browse-menu.ts`, …).
- `Taxonomy` provides admin CRUD for levels/topics/outcomes/skills/tags; list filters reuse `ApiListQueryParams` and extend with taxonomy typed-search (`search_by`, `search_value`).
- `Media` provides the reusable media library dialog (browse/upload/select); taxonomy cover images use it. List filters extend `ApiListQueryParams` with `category` / `sort_order`.
- `Course` provides instructor course CRUD, draft editing tabs, outline sorting, collaborator management, and admin/sysadmin review actions.

## Taxonomy module

- **Types**: `src/types/taxonomy/` — entities, `TaxonomyResourceConfig`, `TaxonomyListColumn`; `TaxonomyListFilters` extends `ApiListQueryParams` with `search_by` / `search_value`.
- **Constants**: `src/constants/taxonomy/resources.ts` — `TAXONOMY_RESOURCES`, `TAXONOMY_RESOURCE_KEYS`, `TAXONOMY_GROUP_READ_PERMISSIONS` (data only).
- **Utils**: `src/lib/utils/taxonomy.ts` — `getTaxonomyResourceConfig()`, `getTaxonomySearchableColumns()`, `getTaxonomyTreeFromEntity()`, `buildTaxonomyDagreRoot()`, `countTaxonomyTreeNodes()`; `src/lib/utils/dagre-tree.ts` — read-only tree layout helpers.
- **Nav**: `src/constants/dashboard/taxonomy-icons.ts` (`TAXONOMY_MENU_ICONS`) + taxonomy nodes in `admin-items.ts` / `sysadmin-items.ts`; filtered by `useFilteredDashboardItems`.
- **API**: `src/api/callers/taxonomy/taxonomy.ts`, `src/api/hooks/taxonomy/useTaxonomy.ts`.
- **UI**: `src/screen/common/taxonomy/taxonomy-list-page.tsx` (`TaxonomyListPage`), `src/screen/admin/taxonomy/*/page.tsx`, `src/screen/sysadmin/taxonomy/*/page.tsx`, `src/components/features/taxonomy/*` (incl. `TaxonomyTreeViewButton` with `nodesDraggable={false}`, `child_render` column), shared `DagreTreeDialog`, `ConfirmDeleteDialog`.
- **Docs**: `docs/taxonomy-admin.md` (routes, permissions, sidebar icons, slug, DnD).

## Media module

- **Types**: `src/types/media/` — `MediaFile`, `MediaListFilters` (= `ApiListQueryParams` + media fields).
- **Constants**: `src/constants/media/file-rules.ts` — upload limits, accept strings, extension lists, `MEDIA_TAB_ACCEPT`, `MEDIA_COLLECTION_ALL_TABS`.
- **Utils**: `src/lib/utils/media.ts` — `isImageFilename`, `getMediaTabExtensions`, `isExecutableExtension`, validation, `isImageMedia`, …
- **Shared utils**: `formatBytes` (`src/lib/utils/format-bytes.ts`) for upload size labels.
- **API**: `src/api/callers/media/media.ts`, `src/api/hooks/media/useMediaFiles.ts`; routes in `API_PRIVATE_ROUTES.media`.
- **UI**: `src/components/features/media/*`; embedded from `taxonomy-form-dialog.tsx`.
- **Docs**: `docs/media-collection.md`.

## Instructor module

- **Types**: `src/types/instructor.ts` — roster, applications, profiles, expertise junction rows, tickets, messages, list filters.
- **Constants**: `src/constants/instructor/resources.ts` — `INSTRUCTOR_GROUP_READ_PERMISSIONS`; `src/constants/dashboard/instructor-icons.ts` — `INSTRUCTOR_MENU_ICONS`; instructor group in `admin-items.ts` / `sysadmin-items.ts` / `instructor-items.ts`.
- **API**: `src/api/callers/instructor/instructor.ts`, `src/api/hooks/instructor/*`; routes in `API_PRIVATE_ROUTES.instructor`.
- **UI**: `src/screen/common/instructor/*` (shared pages), thin `src/screen/{admin,sysadmin}/instructor/*/page.tsx`, `src/screen/instructor/tickets/page.tsx`; `src/components/features/instructor/*`.
- **Docs**: `docs/instructor-admin.md` (routes, permissions, expertise names, tickets).

## Course module

- **Types**: `src/types/course.ts` — version status, outline nodes, collaborators, leases, learner progress, request payloads.
- **API**: `src/api/callers/course/course.ts`, `src/api/hooks/course/useCourses.ts`; routes under `API_PRIVATE_ROUTES.course`.
- **UI**:
  - `src/screen/instructor/courses/page.tsx` — editable course list + create/delete owner flow
  - `src/screen/instructor/courses/editor-page.tsx` — editor shell, status header, and tab orchestration
  - `src/screen/common/course/course-review-page.tsx` — shared admin/sysadmin review queue
  - `src/components/features/course/course-status-badge.tsx`
  - `src/components/features/course/course-delta-editor.tsx`
  - `src/components/features/course/course-editor-basic-tab.tsx`, `course-editor-outline-tab.tsx`, `course-editor-collaborators-tab.tsx`, `course-editor-dialogs.tsx` — split editor render helpers kept outside `src/screen/**` to satisfy the page-only screen rule
  - `src/components/features/instructor/instructor-action-controls.tsx` — shared instructor admin action/footer helpers
  - `src/components/features/instructor/instructor-list-pagination.tsx` — shared instructor/admin/sysadmin pagination helper
- **Hooks**:
  - `src/hooks/course/use-course-editor-state.ts` — shared client editor state, lease lifecycle, translated toasts, and course draft mutation orchestration
- **Reuse points**:
  - `SortableList` for section / lesson / sub-lesson ordering
  - `MediaCollectionDialog` + `ImageFileField` for thumbnail / preview video / text-lesson images
  - `useTaxonomyList` for metadata pickers
  - `useInstructorRosterList` for collaborator selection
  - `next-intl` message dictionaries in `src/messages/{en,vi}.ts` for all course editor, review, badge, and menu copy

## Authorization constants & hooks

- **Constants**: `PERMISSIONS` (58 names), `PERMISSION_IDS` (P1–P58), `ROLES` in `src/constants/` — mirror BE `AllPermissions` and role tags.
- **Types**: `PermissionName`, `PermissionId`, `RoleName` in `src/types/permissions/`.
- **Utils**: `PERMISSION_NAME_TO_ID`, `permissionIdFromName`, `permissionNameFromId` in `src/lib/utils/permission.ts`.
- **Utils**: `src/lib/utils/permission.ts` — `hasAllPermissions` matches BE `RequirePermission` (AND semantics); `filterPermissionNavTree` deep-filters nested nav (dashboard + user menu).
- **Utils**: `src/lib/utils/dashboard.ts` — `filterDashboardItems` wraps `filterPermissionNavTree` for `DashboardItem[]`.
- **Hooks**: `src/hooks/auth/use-permissions.ts` — `useHasPermission`, `useHasAll/AnyPermissions`, `useSatisfiesPermissions`, `useFilteredUserMenuGroups`, `useFilteredDashboardItems` over `useGetMe().mePermissions`.
- **UI**: `PermissionGate` (`src/components/shared/permission-gate.tsx`); user menu via `useFilteredUserMenuGroups` in `UserMenuDropdownItems`; dashboard sidebar via `useFilteredDashboardItems` in `DashboardLayout`.
- **Note**: `MeResponse` has `permissions: string[]` only; no `roles[]` on `/me` yet — gate UI by permission, not role name alone.

## Cross-module contracts
- `Auth UI -> actions/auth -> api/callers` for login/signup submit.
- `api/hooks/auth/useAuth -> hooks/auth/use-auth-store` for SWR-to-Zustand sync.
- `api/instance` depends on `lib/utils/cookie` for isomorphic token read/write.
- `AppProviders -> EventsStreamProvider -> events/registry` starts transports; transports call `events/core/publish` → `store/events`.
- Feature UI listens via `hooks/events/*` (never import transports directly except outbound helpers).

## Events module detail

See [`delivery.md`](./delivery.md) and [`folder-structure.md`](./folder-structure.md) (`src/events/` tree).
