# Modules (`fe-mycourse`)

_Last audited: 2026-05-29 (taxonomy screen layer: common + admin/sysadmin wrappers; TAXONOMY_RESOURCE_KEYS)._


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

## Authorization constants & hooks

- **Constants**: `PERMISSIONS` (40 names), `PERMISSION_IDS` (P1–P40), `ROLES` in `src/constants/` — mirror BE `AllPermissions` and role tags.
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
