# Reusable Assets

_Last audited: 2026-06-14 (Quill SSR lazy load via `ensureQuillLoaded`)._


All reusable utilities, types, hooks, stores, schemas, constants, and shared logic across `fe-mycourse`. Check this file **before** creating any new utility or type to prevent duplication.

---

## UI Primitives

### Asset: Spinner
- **Name**: `Spinner`
- **Type**: React component
- **Path**: `src/components/ui/spinner.tsx` (barrel: `@/components/ui`)
- **Purpose**: Shared animated loading indicator backed by `Loader2Icon`.
- **Scope**: Any component-level loading state that needs a compact spinner; currently reused by login and signup submit buttons during `isSubmitting`.
- **Dependencies**: `lucide-react`, `cn`.
- **Reuse Rule**: Import this component instead of creating local spinner SVGs, animated dots, or duplicate loading indicators.

### Asset: Skeleton
- **Name**: `Skeleton`
- **Type**: React component
- **Path**: `src/components/ui/skeleton.tsx` (barrel: `@/components/ui`)
- **Purpose**: Shared pulse loading placeholder (`animate-pulse`) for page/section skeleton states.
- **Scope**: Reused in instructor course editor loading state (`src/screen/instructor/courses/editor-page.tsx`) and other loading placeholders.
- **Dependencies**: `cn`.
- **Reuse Rule**: Prefer `Skeleton` for loading placeholders instead of custom local placeholder markup.

---

## Static Images

### Asset: Page not found illustration
- **Name**: `thumbnail-page-not-found.png`
- **Type**: Static image (PNG)
- **Path**: `public/assets/images/common/thumbnail-page-not-found.png` (import via `@public/assets/images/common/thumbnail-page-not-found.png`)
- **Purpose**: Hero illustration on the custom 404 page.
- **Scope**: `NotFoundPage` only.
- **Reuse Rule**: Do not duplicate or rename — import from `@public` alias like other marketing assets.

---

## TypeScript Types & Interfaces

### Asset: ApiResponse
- **Name**: `ApiResponse<T>`
- **Type**: Interface
- **Path**: `src/types/api.ts`
- **Purpose**: Standard JSON envelope for every BE API response — mirrors `be/pkg/response/response.go`. `code === 0` means success; any other value is an application-level error.
- **Scope**: All API callers and Service functions.
- **Dependencies**: none.

### Asset: ApiResult
- **Name**: `ApiResult<T>`
- **Type**: Interface
- **Path**: `src/types/api.ts`
- **Purpose**: Return shape for low-level HTTP helpers (`apiFetch`, `apiPost`, etc.) — wraps `data`, `statusCode`, `headers`, `cookies`.
- **Scope**: `src/api/methods.ts`, `src/api/callers/**`.
- **Dependencies**: none.

### Asset: ApiPageInfo
- **Name**: `ApiPageInfo`
- **Type**: Interface
- **Path**: `src/types/api.ts`
- **Purpose**: Pagination metadata — mirrors `be/pkg/response.PageInfo` (`page`, `per_page`, `total_pages`, `total_items`).
- **Scope**: Any list endpoint response.
- **Dependencies**: none.

### Asset: ApiPaginatedData / ApiPaginatedResponse
- **Name**: `ApiPaginatedData<T>`, `ApiPaginatedResponse<T>`
- **Type**: Interface / Type alias
- **Path**: `src/types/api.ts`
- **Purpose**: Paginated response shape — `result` array + `page_info`. Use as the generic for `ApiResponse` when the endpoint returns a list.
- **Scope**: Any list endpoint.
- **Dependencies**: `ApiPageInfo`.

### Asset: ApiListQueryParams / ApiEntityStatus
- **Name**: `ApiListQueryParams`, `ApiEntityStatus`
- **Type**: Interface / Union
- **Path**: `src/types/api.ts`
- **Purpose**: Shared BE list query params (`page`, `per_page`, `search`, `status`, `sort_by`, `sort_desc`) used directly or extended by domain modules (taxonomy extends with typed-search fields).
- **Scope**: List API callers, list screens, SWR hooks.
- **Dependencies**: none.

### Asset: MeResponse
- **Name**: `MeResponse`
- **Type**: Interface
- **Path**: `src/types/auth/auth.ts`
- **Purpose**: Shape of the current user returned by `GET /api/v1/me` — mirrors `be/dto/auth.go MeResponse`.
- **Scope**: `useAuth`, `useMeStore`, any component that reads the current user.
- **Dependencies**: none.

### Asset: LoginResponse / RefreshTokenResponse
- **Name**: `LoginResponse`, `RefreshTokenResponse`
- **Type**: Interface
- **Path**: `src/types/auth/auth.ts`
- **Purpose**: Response bodies for login and token refresh endpoints.
- **Scope**: `src/api/callers/auth/auth.ts`, `src/actions/auth/auth.ts`, `src/api/instance.ts` interceptor.
- **Dependencies**: none.

### Asset: AuthActions
- **Name**: `AuthActions`
- **Type**: Union type (`"none" | "login" | "signup" | "logout"`)
- **Path**: `src/types/auth/auth.ts`
- **Purpose**: Tracks the current auth modal state in `useAuthStore`.
- **Scope**: `src/store/auth/auth.ts`, `src/components/common/auth-menu/`.
- **Dependencies**: none.

### Asset: AuthActionResult
- **Name**: `AuthActionResult`
- **Type**: Interface (`{ success, message, code }`)
- **Path**: `src/actions/auth/auth.ts`
- **Purpose**: Standard return type for all auth Server Actions.
- **Scope**: `loginAction`, `registerAction`, `confirmAction`, `logoutAction` (`signupAction` deprecated alias).
- **Dependencies**: none.

### Asset: ApiErrorEntry
- **Name**: `ApiErrorEntry`
- **Type**: Interface
- **Path**: `src/store/api-error-store.ts`
- **Purpose**: Shape of a stored API error entry — `id`, `statusCode`, `appCode`, `message`, `url`, `method`, `timestamp`.
- **Scope**: `useApiError` store, error display components.
- **Dependencies**: none.

---

## Error Codes & Constants

### Asset: ApiErrorCode
- **Name**: `ApiErrorCode`
- **Type**: Constant object (mirrors `be/pkg/errcode/codes.go`)
- **Path**: `src/constants/api-error-code.ts` (barrel: `@/constants`)
- **Purpose**: FE-side mirror of BE application error codes. Use to compare `response.code` in callers and Server Actions instead of hardcoding numeric values.
- **Scope**: All API callers, Server Actions, interceptors.
- **Dependencies**: none.
- **Current Usage**: `src/api/instance.ts`, `src/actions/auth/auth.ts`, login/signup UI.
- **Reuse Rule**: Always import from here. Never hardcode `code === 0` or `code === 3002` inline.

### Asset: API_PUBLIC_ROUTES
- **Name**: `API_PUBLIC_ROUTES`
- **Type**: Constant object
- **Path**: `src/constants/api-route.ts`
- **Purpose**: All public (unauthenticated) BE API endpoint paths. Prevents scattered hardcoded strings.
- **Current Entries**: `auth.login`, `auth.register`, `auth.confirm`, `auth.refresh`, `auth.logout`.
- **Scope**: API callers, `api/instance.ts` token refresh interceptor.
- **Dependencies**: none.

### Asset: API_PRIVATE_ROUTES
- **Name**: `API_PRIVATE_ROUTES`
- **Type**: Constant object
- **Path**: `src/constants/api-route.ts`
- **Purpose**: All authenticated BE API endpoint paths.
- **Current Entries**: grouped constants for `user`, `taxonomy`, `media`, `instructor`, `course`.
- **Scope**: API callers.
- **Dependencies**: none.

### Asset: PUBLIC_ROUTES
- **Name**: `PUBLIC_ROUTES`
- **Type**: Constant object
- **Path**: `src/constants/route.ts`
- **Purpose**: FE client-side route constants (paths for navigation).
- **Current Entries**: `home`, `forgotPassword`, `confirmEmail`, `logout` (paths without locale prefix — use `@/i18n/navigation`).
- **Scope**: Navigation helpers, links, router.
- **Dependencies**: none.

### Asset: PRIVATE_ROUTES
- **Name**: `PRIVATE_ROUTES`
- **Type**: Constant object
- **Path**: `src/constants/route.ts`
- **Purpose**: FE private route map (login-required) grouped by module: `admin`, `instructor`, `sysadmin`, and account surfaces.
- **Scope**: dashboard menus, user menu links, instructor/admin/sysadmin navigation.
- **Dependencies**: none.

### Asset: PUBLIC_RESOURCE_ROUTES / PRIVATE_RESOURCE_ROUTES
- **Name**: `PUBLIC_RESOURCE_ROUTES`, `PRIVATE_RESOURCE_ROUTES`
- **Type**: Constant object
- **Path**: `src/constants/route.ts`
- **Purpose**: Dynamic FE route templates with `:param` placeholders for resource/detail pages.
- **Current Entries**:
  - `PRIVATE_RESOURCE_ROUTES.instructor.courseEditor` (`/instructor/courses/:courseId/info`)
  - `PRIVATE_RESOURCE_ROUTES.instructor.courseEditorTab` (`/instructor/courses/:courseId/:tab`)
- **Scope**: Navigation helpers and screens that need parameterized routes.
- **Dependencies**: none.

### Asset: route builders (`toPublicRoute`, `toPrivateRoute`, `toPublicResourceRoute`, `toPrivateResourceRoute`)
- **Name**: `toPublicRoute`, `toPrivateRoute`, `toPublicResourceRoute`, `toPrivateResourceRoute`
- **Type**: Utility functions
- **Path**: `src/lib/navigation/routes.ts`
- **Purpose**: Convert route constants/templates into runtime href strings (supports params/query/fragment through `buildQueryParams` reuse).
- **Scope**: screens, shared menu/sidebar constants, navigation helpers.
- **Dependencies**: `PUBLIC_ROUTES`, `PRIVATE_ROUTES`, `PUBLIC_RESOURCE_ROUTES`, `PRIVATE_RESOURCE_ROUTES`, `buildQueryParams`.

### Asset: pre-built navigation hrefs (`homeHref`, `logoutHref`, `adminCoursesHref`, ...)
- **Name**: `homeHref`, `forgotPasswordHref`, `logoutHref`, `adminRootHref`, `instructorCoursesHref`, `sysadminCoursesHref`, `accountMyCoursesHref`, ...
- **Type**: Constant strings
- **Path**: `src/lib/navigation/routes.ts`
- **Purpose**: Shared route outputs generated from route builders to avoid duplicated conversion in call sites.
- **Scope**: auth components, header/user menu constants, dashboard constants.
- **Dependencies**: route builder functions in same module.

### Asset: `instructorCourseEditorHref(courseId)` / `instructorCourseEditorTabHref(courseId, tab)`
- **Name**: `instructorCourseEditorHref`, `instructorCourseEditorTabHref`
- **Type**: Utility function
- **Path**: `src/lib/navigation/routes.ts`
- **Purpose**: Build instructor course editor routes from the centralized `PRIVATE_RESOURCE_ROUTES.instructor.courseEditor*` templates without string interpolation.
- **Scope**: instructor course list page, tab navigation, and any future instructor course detail navigation.
- **Dependencies**: `toPrivateResourceRoute`.

### Asset: `renderInstructorCourseEditorRoute(props, tab)`
- **Name**: `renderInstructorCourseEditorRoute`, `InstructorCourseEditorRouteProps`
- **Type**: Shared route adapter + route props type
- **Path**: `src/components/features/instructor/instructor-course-editor-route.tsx`
- **Purpose**: Keep instructor course editor route glue out of `src/app/**` by centralizing the `courseId` param unwrap and forwarding the selected `CourseEditorTab` into `InstructorCourseEditorPage`.
- **Scope**: the 5 App Router pages under `src/app/[locale]/instructor/courses/[courseId]/{info,outline,collaborators,pricing,certificate}/page.tsx`.
- **Dependencies**: `InstructorCourseEditorPage`, `CourseEditorTab`.
- **Reuse Rule**: Reuse this adapter and its exported props type for instructor course editor routes instead of re-declaring `params` shapes or rebuilding the same route-to-screen handoff in each page file.

### Asset: PERMISSIONS
- **Name**: `PERMISSIONS`
- **Type**: Constant object (40 entries)
- **Path**: `src/constants/permissions.ts`
- **Purpose**: Canonical permission names — 1:1 mirror of BE `constants.AllPermissions` (e.g. `CourseCreate` → `course:create`).
- **Scope**: Permission checks, admin UI labels, API alignment.
- **Dependencies**: none.

### Asset: PERMISSION_IDS
- **Name**: `PERMISSION_IDS`
- **Type**: Constant object (`P1`…`P58`)
- **Path**: `src/constants/permission-ids.ts`
- **Purpose**: DB `permissions.permission_id` keyed like BE `perm_id` tags.
- **Scope**: Admin RBAC UI, id ↔ name lookup via utils.
- **Dependencies**: `PERMISSIONS` (paired keys).

### Asset: ROLES
- **Name**: `ROLES`
- **Type**: Constant object
- **Path**: `src/constants/roles.ts`
- **Purpose**: Role name literals (`sysadmin`, `admin`, `instructor`, `learner`) — mirror BE `role:"..."` tags. Use with permission checks; `/me` does not return roles yet.
- **Scope**: Future role-based UI; documentation only until BE exposes roles on `MeResponse`.
- **Dependencies**: none.

### Asset: Permission types (`PermissionName`, `PermissionId`, `RoleName`, …)
- **Name**: `PermissionName`, `PermissionId`, `RoleName`, `PermissionAction`, `ParsedPermission`, `PermissionCheckMode`, `PermissionRequirement`
- **Type**: TypeScript types
- **Path**: `src/types/permissions/index.ts`
- **Purpose**: Typed permission names and config-driven guard shape (`PermissionRequirement`).
- **Scope**: Hooks, utils, menu constants, `PermissionGate`.
- **Dependencies**: `PERMISSIONS`, `PERMISSION_IDS`, `ROLES` (value imports from `@/constants` allowed in type files per ESLint).

### Asset: User menu types (`UserMenuItem`, `UserMenuGroup`, `UserMenuStatus`)
- **Name**: `UserMenuStatus`, `UserMenuItem`, `UserMenuGroup`
- **Type**: TypeScript types
- **Path**: `src/types/user-menu.ts` (barrel: `@/types` or `@/types/user-menu`)
- **Purpose**: Dropdown menu config shape; extends `PermissionRequirement` for optional guards on items. `UserMenuItem` supports optional `titleKey` (user-menu i18n label) and nested `children` (filtered recursively). Current header dropdown entries all provide both `title` and `titleKey`.
- **Scope**: `HEADER_DROPDOWN_ITEMS`, `filterUserMenuGroups`, `filterUserMenuItems`, auth menu UI.
- **Dependencies**: `PermissionRequirement` from `src/types/permissions/`.

### Asset: Permission utils (`hasPermission`, `hasAllPermissions`, …)
- **Name**: `toPermissionSet`, `hasPermission`, `hasAllPermissions`, `hasAnyPermission`, `satisfiesPermissions`, `canShowWithPermissions`, `filterPermissionNavTree`, `filterUserMenuItems`, `filterUserMenuGroups`, `parsePermissionName`, `permissionNameFromId`, `permissionIdFromName`, `PERMISSION_NAME_TO_ID`, …
- **Type**: Pure functions
- **Path**: `src/lib/utils/permission.ts` (barrel: `@/lib/utils`)
- **Purpose**: Client-safe permission checks; `PERMISSION_NAME_TO_ID` is the bidirectional name ↔ id map for admin UI. `hasAllPermissions` / default `satisfiesPermissions` mode mirror BE `RequirePermission` (AND). Empty/omitted `permissions` on a requirement ⇒ allow. `filterPermissionNavTree` bottom-up filters nested nav: recurse children first; leaves with `href` require `satisfiesPermissions`; branch nodes without `href` stay when any permitted descendant remains. `filterUserMenuGroups` deep-filters items per group and drops empty groups (no group pre-gate).
- **Scope**: Hooks, menu filtering, server/client guards, admin tooling.
- **Dependencies**: `PERMISSIONS`, `PERMISSION_IDS`, permission types, `UserMenuGroup` from `src/types/user-menu.ts`.

### Asset: Dashboard types (`DashboardItem`, `DashboardLayoutProps`)
- **Name**: `DashboardItem`, `DashboardCustomStyles`, `DashboardLayoutProps`
- **Type**: TypeScript types
- **Path**: `src/types/dashboard/index.ts` (barrel: `@/types`)
- **Purpose**: Recursive dashboard nav config with `PermissionRequirement`, Lucide icons, optional nested `children`, and layout callback props.
- **Scope**: `DashboardLayout`, role menu constants, permission filtering.
- **Dependencies**: `PermissionRequirement`, `lucide-react`.

### Asset: `filterDashboardItems`
- **Name**: `filterDashboardItems`
- **Type**: Pure function
- **Path**: `src/lib/utils/dashboard.ts` (barrel: `@/lib/utils`)
- **Purpose**: Thin wrapper around `filterPermissionNavTree` for `DashboardItem[]` (deep bottom-up filter at every nesting level).
- **Scope**: `useFilteredDashboardItems`, `DashboardSidebar`.
- **Dependencies**: `filterPermissionNavTree`, `DashboardItem`.

### Asset: `useFilteredDashboardItems`
- **Name**: `useFilteredDashboardItems`
- **Type**: React hook
- **Path**: `src/hooks/auth/use-permissions.ts`
- **Purpose**: Memoized `filterDashboardItems(usePermissionSet(), items)`.
- **Scope**: `DashboardLayout` and any client dashboard nav.
- **Dependencies**: `usePermissionSet`, `filterDashboardItems`.

### Asset: `INSTRUCTOR_MENU_ICONS`
- **Name**: `INSTRUCTOR_MENU_ICONS`
- **Type**: Constant (`Record<"group" | "roster" | "approvals" | "profiles" | "expertise" | "tickets", LucideIcon>`)
- **Path**: `src/constants/dashboard/instructor-icons.ts`
- **Purpose**: Shared Lucide icons for the instructor admin sidebar group and five child routes. Imported by `admin-items.ts`, `sysadmin-items.ts`, and `instructor-items.ts` (tickets).
- **Scope**: Admin/sysadmin instructor nav + instructor role tickets menu.
- **Dependencies**: `lucide-react`, `LucideIcon`.

### Asset: Instructor API callers & hooks
- **Name**: `listInstructorRosterService`, `useInstructorApplicationsList`, …
- **Type**: Service functions + SWR hooks
- **Path**: `src/api/callers/instructor/instructor.ts`, `src/api/hooks/instructor/*`
- **Purpose**: HTTP + cache for roster, applications (approve/reject), profiles, expertise, tickets.
- **Scope**: `src/screen/common/instructor/*`, `src/screen/instructor/tickets/page.tsx`.
- **Dependencies**: `API_PRIVATE_ROUTES.instructor`, `src/types/instructor.ts`.

### Asset: `TAXONOMY_MENU_ICONS`
- **Name**: `TAXONOMY_MENU_ICONS`
- **Type**: Constant (`Record<"group" \| "levels" \| "topics" \| "outcomes" \| "skills" \| "tags", LucideIcon>`)
- **Path**: `src/constants/dashboard/taxonomy-icons.ts`
- **Purpose**: Shared Lucide icons for the taxonomy sidebar group and five child resources (`Network`, `Layers`, `BookMarked`, `Target`, `Brain`, `Tags`). Imported by `admin-items.ts` and `sysadmin-items.ts`.
- **Scope**: Admin/sysadmin dashboard taxonomy nav only.
- **Dependencies**: `lucide-react`, `LucideIcon`.

### Asset: Role dashboard menu constants
- **Name**: `ADMIN_DASHBOARD_ITEMS`, `INSTRUCTOR_DASHBOARD_ITEMS`, `SYSADMIN_DASHBOARD_ITEMS`
- **Type**: Constant (`DashboardItem[]`)
- **Path**: `src/constants/dashboard/` (`admin-items.ts`, `sysadmin-items.ts`, `instructor-items.ts`, `taxonomy-icons.ts`, `instructor-icons.ts`; barrel: `@/constants/dashboard`)
- **Purpose**: Nav trees per role with nested children, Lucide `icon`, optional `titleKey`, and permission gates aligned to BE `permissions.go`. Taxonomy subtree uses `TAXONOMY_MENU_ICONS`; instructor admin subtree uses `INSTRUCTOR_MENU_ICONS` + `INSTRUCTOR_GROUP_READ_PERMISSIONS`.
- **Scope**: App route layouts under `src/app/[locale]/{admin,instructor,sysadmin}/layout.tsx`.
- **Dependencies**: `PERMISSIONS`, `TAXONOMY_MENU_ICONS`, `TAXONOMY_GROUP_READ_PERMISSIONS`, `DashboardItem`.

### Asset: Dashboard shell components
- **Name**: `DashboardLayout`, `RoleDashboardLayout`, `DashboardSidebar`, `HeaderDashboard`, `DashboardUnauthorized`
- **Type**: Client components
- **Path**: `src/components/common/dashboard/`, `src/components/common/header/header-dashboard.tsx`
- **Purpose**: Role dashboard chrome: `DashboardLayout` owns the shell; `RoleDashboardLayout` centralizes admin/sysadmin role config (items + shell permission) and forwards into `DashboardLayout`. `DashboardLayout` still provides `SidebarProvider` + fixed sidebar under `HeaderDashboard` (`h-16`); `collapsible="icon"` (collapsed = root icons + tooltips); mobile nav via `Sheet` with `DashboardSidebarMobileHeader` / `DashboardSidebarLocaleFooter`. Locale: `DashboardHeaderLocale` (`LocaleSwitcher` + `useCodeLabelLanguage`, `lg+`) and drawer footer (`fullWidth`, below `lg`) — same pattern as `header.tsx` / `header-mobile-sidebar.tsx`. `HeaderDashboard` exposes `leading` / `trailing` slots only (no built-in locale). Layout permission gate + unauthorized fallback.
- **Scope**: `/admin`, `/instructor`, `/sysadmin` routes.
- **Dependencies**: shadcn `Sidebar*` (includes `TooltipProvider`), `LocaleSwitcher`, RBAC hooks, `LoginSignupPopup`.

### Asset: LocaleSwitcher
- **Name**: `LocaleSwitcher`
- **Type**: Client component
- **Path**: `src/components/common/header/locale-switcher.tsx`
- **Purpose**: Dropdown locale menu; `href={usePathname()}` + `locale` on `Link` preserves current route across `en` / `vi`.
- **Scope**: `Header` (desktop `lg+`), `HeaderMobileSidebar` footer, `DashboardLayout` chrome.
- **Dependencies**: `useCustomLanguage`, `LANGUAGE_OPTIONS`, `@/i18n/navigation`.

### Asset: Permission hooks (`useHasPermission`, …)
- **Name**: `usePermissionSet`, `useHasPermission`, `useHasAllPermissions`, `useHasAnyPermissions`, `useSatisfiesPermissions`, `useFilteredUserMenuGroups`, `useFilteredDashboardItems`
- **Type**: React hooks
- **Path**: `src/hooks/auth/use-permissions.ts` (barrel: `@/hooks/auth`)
- **Purpose**: Read `mePermissions` from `useGetMe()` and expose memoized Set + boolean guards; `useFilteredUserMenuGroups` defaults to `HEADER_DROPDOWN_ITEMS`.
- **Scope**: Any client component that gates UI by permission or renders the user menu.
- **Dependencies**: `useGetMe`, permission utils, `PermissionName`, `PermissionRequirement`.

### Asset: PermissionGate
- **Name**: `PermissionGate`
- **Type**: Client component
- **Path**: `src/components/shared/permission-gate.tsx` (barrel: `@/components/shared`)
- **Purpose**: Render `children` only when `useSatisfiesPermissions` passes; optional `fallback` (default `null`).
- **Scope**: Pages and arbitrary UI blocks.
- **Dependencies**: `useSatisfiesPermissions`, `PermissionRequirement`.

### Asset: HEADER_DROPDOWN_ITEMS
- **Name**: `HEADER_DROPDOWN_ITEMS`
- **Type**: Constant (`UserMenuGroup[]`)
- **Path**: `src/constants/common.ts`
- **Purpose**: Static configuration for the user dropdown menu in the header. Each item may declare `permissions`, optional `permissionMode` (`"all"` default, `"any"` for OR), and optional `titleKey` for translated labels. The `roles` group is listed first, followed by study, account, and session. The role-switch group (`/sysadmin`, `/admin`, `/instructor`) stays permission-gated by role-modify permissions; the older study/account item guards are temporarily commented out in config. Logout group omits permissions (always visible when logged in).
- **Scope**: `UserMenuDropdownItems` (via `useFilteredUserMenuGroups`), `user-menu.tsx`, `sidebar-auth-footer.tsx`.
- **Dependencies**: `UserMenuGroup`, `UserMenuItem` (`src/types/user-menu.ts`), `PERMISSIONS`.

### Asset: LANGUAGE_OPTIONS
- **Name**: `LANGUAGE_OPTIONS`
- **Type**: Constant array
- **Path**: `src/constants/common.ts`
- **Purpose**: Locale options for the locale switcher — `{ locale, label }`.
- **Scope**: `src/components/common/header/locale-switcher.tsx`.
- **Dependencies**: none.

---

## Utility Functions

### Asset: cn
- **Name**: `cn(...inputs: ClassValue[]): string`
- **Type**: Utility function
- **Path**: `src/lib/utils/cn.ts`
- **Purpose**: Merge Tailwind class names without conflicts — wraps `clsx` + `tailwind-merge`. **Primary styling utility — use everywhere for conditional classes.**
- **Scope**: All components.
- **Dependencies**: `clsx`, `tailwind-merge`.
- **Reuse Rule**: Never use `clsx` or `tailwind-merge` directly; always use `cn()`.

### Asset: isServer
- **Name**: `isServer(): boolean`
- **Type**: Utility function
- **Path**: `src/lib/utils/runtime.ts`
- **Purpose**: Returns `true` when running on the server (SSR/Server Component). Replaces scattered `typeof window === "undefined"` checks.
- **Scope**: Any isomorphic utility that needs to branch on runtime environment.
- **Dependencies**: none.

### Asset: buildQueryParams
- **Name**: `buildQueryParams(url, query?, params?, fragment?): string | null`
- **Type**: Utility function
- **Path**: `src/lib/utils/url.ts`
- **Purpose**: Build a URL from a path template, named route params (`:name` placeholders), query string, and optional fragment. All values are properly URI-encoded to prevent injection.
- **Scope**: API callers (building endpoint keys), navigation helpers.
- **Dependencies**: none.
- **Reuse Rule**: Use whenever building a URL with dynamic segments or query params. Do not do manual string concatenation.

### Asset: apiListQueryToRecord
- **Name**: `apiListQueryToRecord(params: ApiListQueryParams): Record<string, string>`
- **Type**: Utility function
- **Path**: `src/lib/utils/list-query.ts`
- **Purpose**: Convert shared list filters to query key/values for `buildQueryParams`. Use instead of per-module full `filtersToQuery` helpers. Supports `sort_desc` (taxonomy), `sort_order` + `category` (media); taxonomy caller appends typed-search keys (`search_by`, `search_value`) after base conversion.
- **Scope**: Taxonomy and media list callers; future paginated list callers.
- **Dependencies**: `ApiListQueryParams`.

### Asset: formatBytes
- **Name**: `formatBytes(bytes: number): string`
- **Type**: Utility function
- **Path**: `src/lib/utils/format-bytes.ts`
- **Purpose**: Format a byte count as `B`, `KB`, `MB`, or `GB` for display (one decimal for KB/MB, two for GB).
- **Scope**: `MediaUploadDialog` file list and total size; any UI showing file or storage size.
- **Dependencies**: none.
- **Reuse Rule**: Import from `@/lib/utils` (barrel). Do not duplicate inline formatters in feature components.

### Asset: Taxonomy config types
- **Name**: `TaxonomyListColumnId`, `TaxonomyListColumn`, `TaxonomyResourceConfig`
- **Type**: Type aliases
- **Path**: `src/types/taxonomy/index.ts`
- **Purpose**: Column and per-resource admin config shapes for taxonomy list screens and API callers.
- **Scope**: `taxonomy-table-columns`, `TAXONOMY_RESOURCES` constant object (typed via `import type`).
- **Dependencies**: `TaxonomyResourceKey`.

### Asset: Taxonomy config helpers
- **Name**: `getTaxonomyResourceConfig`, `getTaxonomySearchableColumns`, `getTaxonomyTreeFromEntity`, `buildTaxonomyDagreRoot`, `toTaxonomyTreeWritePayload`, `createTaxonomyTreeNode`, `countTaxonomyTreeNodes`
- **Type**: Utility functions
- **Path**: `src/lib/utils/taxonomy.ts`
- **Purpose**: Resolve `TAXONOMY_RESOURCES` entry, searchable column ids, extract nested tree from entity, build dagre root for read-only popup, strip slug for write payloads, create empty editor node, count nested nodes for button state.
- **Scope**: Taxonomy list page, form dialog, table columns, tree view button.
- **Dependencies**: `TAXONOMY_RESOURCES` (`src/constants/taxonomy/resources.ts`), `TaxonomyTreeNode`, `DagreTreeRoot` (`dagre-tree.ts`).

### Asset: `TAXONOMY_RESOURCE_KEYS`
- **Name**: `TAXONOMY_RESOURCE_KEYS`
- **Type**: Constant array
- **Path**: `src/constants/taxonomy/resources.ts`
- **Purpose**: Canonical ordered list of taxonomy resource keys (`levels`, `topics`, `outcomes`, `skills`, `tags`) typed as `readonly TaxonomyResourceKey[]`.
- **Scope**: Route/screen generation, iteration over resources; keep in sync with `TAXONOMY_RESOURCES` keys.
- **Dependencies**: `TaxonomyResourceKey` type.

### Asset: shared API query helpers
- **Name**: `useApiListQuery`, `useApiRowsQuery`, `useApiDetailQuery`
- **Type**: Client hook helpers
- **Path**: `src/api/hooks/shared.ts`
- **Purpose**: Normalize common SWR return shapes so domain hooks can reuse one list/detail implementation instead of duplicating `rows/pageInfo/isLoading/error/mutate`.
- **Scope**: taxonomy, instructor, course, and media hooks.
- **Dependencies**: `useSWR`, `ApiPaginatedData`.

### Asset: `TaxonomyListPage`
- **Name**: `TaxonomyListPage`, `TaxonomyListPageProps`
- **Type**: React component (client)
- **Path**: `src/screen/common/taxonomy/taxonomy-list-page.tsx`
- **Purpose**: Shared admin CRUD list for all five taxonomy resources (DataTable toolbar, form dialog with `formDialogKey` remount on create/edit, delete confirm, pagination).
- **Scope**: Imported directly by app routes under `src/app/[locale]/{admin,sysadmin}/taxonomy/*/page.tsx`.
- **Dependencies**: `useTaxonomyList`, `TaxonomyFormDialog`, `DataTable`, `getTaxonomyResourceConfig`, `getTaxonomySearchableColumns`.

### Asset: `TaxonomyFormDialog`
- **Name**: `TaxonomyFormDialog`, `TaxonomyFormDialogProps`
- **Type**: React component (client)
- **Path**: `src/components/features/taxonomy/taxonomy-form-dialog.tsx`
- **Purpose**: Create/update taxonomy rows per `resourceKey`; initializes `useForm` and local tree/description/image state from `initialData` on mount (no `useEffect` sync). Slug preview is read-only via `resolveTaxonomySlugPreview(name, persistedSlug)`.
- **Scope**: Opened from `TaxonomyListPage`; parent must remount with `key` when controlled `open` toggles from table actions.
- **Dependencies**: `getTaxonomyResourceConfig`, `getTaxonomyTreeFromEntity`, `toTaxonomyTreeWritePayload`, `slugifyName`, `MediaCollectionDialog`, taxonomy Zod schemas.

### Asset: Media filename / extension helpers
- **Name**: `isImageFilename`, `getMediaTabExtensions`, `isExecutableExtension`
- **Type**: Utility functions
- **Path**: `src/lib/utils/media.ts`
- **Purpose**: Extension checks for upload validation and `isImageMedia`; tab accept lists come from `src/constants/media/file-rules.ts`.
- **Scope**: `validateMediaUploadBatch`, `isImageMedia`, upload dialog accept strings via constants.
- **Dependencies**: `MEDIA_*_EXTENSIONS` constants in `file-rules.ts`.

### Asset: SortableList
- **Name**: `SortableList`, `SortableListItem`
- **Type**: React component
- **Path**: `src/components/shared/sortable-list.tsx`
- **Purpose**: Vertical drag-and-drop reorder via `@dnd-kit` (first DnD usage in the repo).
- **Scope**: Course outline tab (sections/lessons/sub-lessons), taxonomy description editor, tree editor; any list with stable string `id`.
- **Dependencies**: `@dnd-kit/core`, `@dnd-kit/sortable`.

### Asset: course outline reorder helpers
- **Name**: `assignSequentialOrderIndex`, `withOutlineSections`, `replaceSectionLessons`, `replaceLessonSubLessons`, `mergeReorderedLessons`, `mergeReorderedSubLessons`
- **Type**: Utility functions
- **Path**: `src/lib/utils/course.ts`
- **Purpose**: Patch `CourseDetail.outline` for optimistic drag reorder and merge reorder API responses without duplicating nested outline shape logic.
- **Scope**: `useCourseOutlineReorder` hook; pairs with `reorderCourseSectionsService` / `reorderCourseLessonsService` / `reorderCourseSubLessonsService`.
- **Dependencies**: `CourseDetail` / outline node types from `src/types/course.ts`.

### Asset: useCourseOutlineReorder
- **Name**: `useCourseOutlineReorder`
- **Type**: React hook
- **Path**: `src/hooks/course/use-course-outline-reorder.ts`
- **Purpose**: Optimistic section/lesson/sub-lesson reorder for the course editor: immediate SWR cache update, ephemeral lease, reorder API, success toast + API merge, failure toast + snapshot rollback.
- **Scope**: Composed by `useCourseEditorState`; wired from `InstructorCourseEditorPage` outline tab actions.
- **Dependencies**: `course.ts` outline helpers, reorder API callers, `toastApiError`, lease acquire/release from `useCourseLeaseState`.

### Asset: CourseOutlineRowActions
- **Name**: `CourseOutlineRowActions`
- **Type**: React component
- **Path**: `src/components/features/course/course-editor-outline-row-actions.tsx`
- **Purpose**: Shared outline row action menu for section, lesson, and sub-lesson (item) rows. `DropdownMenu` trigger uses `course.common.actions`; menu entries come from `OUTLINE_ROW_ACTIONS` keyed by `CourseOutlineItemKind` (`section` | `lesson` | `item`).
- **Scope**: `course-editor-outline-tab.tsx` (`SectionOutlineCard` and nested lesson/item rows).
- **Dependencies**: `DropdownMenu` / `DropdownMenuItem` (`variant="destructive"` for delete), `CourseOutlineItemKind` from `src/types/course.ts`, i18n `course.editor.outline.*`.

### Asset: DagreTreeDialog
- **Name**: `DagreTreeDialog`, `DagreTreeDialogProps`, `DagreTreeDialogLabels`
- **Type**: React component
- **Path**: `src/components/shared/dagre-tree-dialog.tsx`
- **Purpose**: Tree visualization in a dialog via `@xyflow/react` + `dagre` (vertical default, horizontal toggle). Props: `nodesDraggable` (default `true` — drag nodes, edges stay attached; `false` locks positions). Node labels: **name only**.
- **Scope**: Taxonomy topics/skills (`TaxonomyTreeViewButton` with `nodesDraggable={false}`); reusable for any `{ id, name, children? }` tree.
- **Dependencies**: `Dialog`, `ToggleGroup`, `useNodesState` / `useEdgesState`, `treeToFlowElements` in `src/lib/utils/dagre-tree.ts`. CSS: `@xyflow/react/dist/style.css` in the dialog file.

### Asset: course delta helpers
- **Name**: `createEmptyDelta`, `createEmptyDeltaString`, `parseDelta`, `coerceToDelta`, `stringifyDelta`, `extractPlainText`, `extractDeltaPreviewText`, `stripMediaEmbedsFromDelta`, `extractMediaEmbedsFromDelta`, `diffRemovedMediaEmbeds`, `countDeltaNonWhitespace`
- **Type**: Utility functions
- **Path**: `src/lib/utils/course-delta.ts`
- **Purpose**: Shared Quill-Delta parsing/stringify/text extraction, legacy plain-text coercion (`coerceToDelta`), outline preview text (`extractDeltaPreviewText`), media-embed diffing, and non-whitespace counting for course validation (matches BE `CountDeltaNonWhitespace` fallback for non-JSON values).
- **Scope**: `DeltaEditor`, course editor state, outline tab previews, and Zod schemas.
- **Dependencies**: `media.ts` (`MediaEmbedKind` for `DeltaMediaEmbed`).

### Asset: DeltaEditor / DeltaViewer
- **Name**: `DeltaEditor`, `DeltaEditorProps`, `DeltaViewer`, `DeltaViewerProps`, `registerQuillFormats`, `QUILL_FONT_WHITELIST`
- **Type**: React components + Quill setup helper
- **Path**: `src/components/shared/delta-editor.tsx` (exported from `src/components/shared/index.ts`); Quill helpers + styles in `src/lib/quill/` (`delta-editor-quill.ts`, `delta-editor.css`)
- **Purpose**: Word-like WYSIWYG editing and read-only rendering for Quill Delta JSON. Toolbar includes font family (Roboto, Gilroy, Geist Mono, serif, monospace), text formatting, and inline image/video via toolbar + `MediaCollectionDialog`, paste (Ctrl+V), or drag-and-drop. Embeds show an **×** remove control; removal (button or Backspace/Delete) calls `onDelete`. Paste/drop does **not** call upload APIs inside the shared component — parent supplies `onObjectEmbedded`. Default surface `max-h-[500px]` (overridable); content scrolls inside `.ql-container` (`scrollbar-app`).
- **Props**: `allowMediaEmbed` (default `true`) — when `false`, hides image/video toolbar actions, blocks paste/drop media, strips embed ops from saved Delta (text formatting only), and uses short i18n placeholder (`placeholderTextOnly`: “Write content here.” / “Viết nội dung tại đây.”) instead of the media paste/drop hint. `surfaceClassName` — Quill bordered surface (default `max-h-[500px]` via `DELTA_EDITOR_DEFAULT_MAX_HEIGHT_CLASS`; override e.g. `max-h-[600px]`). `DeltaViewer` uses `className` on the same surface. `onObjectEmbedded(file, kind) => Promise<MediaFile | null>` — parent uploads and returns the file (required for paste/drop). `onDelete(embed: DeltaMediaEmbedRef)` — parent deletes the backing media file (e.g. `deleteMediaFile(object_key)`).
- **Scope**: Course basic info (`about_course`), section `description` / lesson `summary` (text-only via `allowMediaEmbed={false}`), TEXT sub-lessons (`text_delta`), and any future Delta-backed rich text.
- **Dependencies**: `quill` (loaded via `ensureQuillLoaded()` in `@/lib/quill`), `course-delta.ts`, `media.ts` (`classifyMediaEmbedFile`, `DeltaMediaEmbedRef`, paste/drop helpers), `MediaCollectionDialog`. Upload/delete wiring: `useDeltaEditorMediaHandlers` in `src/hooks/quill/`. Safe to re-export from `src/components/shared/index.ts` — Quill is not evaluated at module load time.

### Asset: Quill editor helpers
- **Name**: `ensureQuillLoaded`, `registerQuillFormats`, `QUILL_FONT_WHITELIST`, `bindQuillMediaPasteAndDrop`, `bindQuillMediaEmbedRemove`, …
- **Type**: Quill setup utilities (no React)
- **Path**: `src/lib/quill/delta-editor-quill.ts`, `delta-editor.css` (barrel: `src/lib/quill/index.ts`)
- **Purpose**: Custom image/video blots, toolbar config, paste/drop interception, embed × remove click handler, media embed registry helpers. **`ensureQuillLoaded()`** dynamically imports Quill + snow/project CSS on the client only (avoids SSR `document is not defined` when `@/components/shared` barrel pulls in `delta-editor.tsx`). Call it before `new Quill(...)` or any helper that touches the Quill runtime.
- **Scope**: `DeltaEditor`, `DeltaViewer`.
- **Dependencies**: `quill` (dynamic import), `course-delta.ts`, `media.ts`.

### Asset: useDeltaEditorMediaHandlers
- **Name**: `useDeltaEditorMediaHandlers`
- **Type**: React hook
- **Path**: `src/hooks/quill/use-delta-editor-media-handlers.ts` (barrels: `src/hooks/quill/index.ts`, `src/hooks/index.ts`)
- **Purpose**: Shared `onObjectEmbedded` / `onDelete` callbacks for `DeltaEditor` — validates upload batch, calls `uploadMediaFiles` / `deleteMediaFile`, permission gates (`MediaFileCreate` / `MediaFileDelete`), and `toastApiError`.
- **Scope**: `course-editor-basic-tab.tsx`, `course-editor-dialogs.tsx` (TEXT sub-lesson with media embeds only).
- **Dependencies**: `api/callers/media`, `media.ts` (`validateMediaUploadBatch`), `useSatisfiesPermissions`.

### Asset: course editor utils

- **Type**: Utility functions
- **Path**: `src/lib/utils/course.ts`
- **Purpose**: Pure course editor helpers — `courseEditorTabs` registry, basic-info/sub-lesson form state factories, `toUpdateCourseBasicInfoPayload` (PATCH fields only — no `title`), taxonomy id `Set` mapping, `rootOutlineStableId(courseId)` (`OUTLINE_ROOT` lease key = course UUID v7 from BE), `validateSubLessonFormContent` / `validateCourseSubmitReadiness` (QUIZ rules delegate to `courseQuizOptionSchema`), and quiz editor state helpers `applyQuizAllowMultipleChange` / `applyQuizOptionCorrectChange` for `SubLessonQuizFields`.
- **Scope**: `use-course-editor-state`, `editor-page.tsx`.
- **Dependencies**: `course-delta.ts` (`createEmptyDeltaString`).

### Asset: dagre-tree utils
- **Name**: `DagreTreeRoot`, `treeToFlowElements`, `getLayoutedElements`
- **Type**: Utility functions
- **Path**: `src/lib/utils/dagre-tree.ts`
- **Purpose**: Walk a minimal tree shape (`id`, `name`, optional `children`) and produce layouted React Flow nodes/edges via dagre. Node `data.label` = `name` only.
- **Scope**: `DagreTreeDialog`; structurally compatible with `TaxonomyTreeNode` (no taxonomy import).
- **Dependencies**: `@xyflow/react`, `dagre`.

### Asset: SortableTreeEditor
- **Name**: `SortableTreeEditor`
- **Type**: React component
- **Path**: `src/components/shared/sortable-tree-editor.tsx`
- **Purpose**: Nested drag-and-drop tree with name field and read-only slug preview per node. Uses shared `TaxonomyTreeNode` (no duplicate tree type).
- **Scope**: Taxonomy topics/skills (`TaxonomyTreeEditor` wrapper); similar JSONB trees elsewhere.
- **Dependencies**: `SortableList`, `slugifyName`, `createTaxonomyTreeNode`, `TaxonomyTreeNode`.

### Asset: ImageFileField
- **Name**: `ImageFileField`, `ImageFileFieldProps`
- **Type**: React component
- **Path**: `src/components/shared/image-file-field.tsx`
- **Purpose**: Shared image picker/preview field with optional permission gate for the browse action and clear/reset support.
- **Scope**: Taxonomy forms today; reusable for any form that stores `image_file_id` + preview URL.
- **Dependencies**: `PermissionGate` (optional), `Button`, `Label`, `next/image`.

### Asset: DataTable
- **Name**: `DataTable`, `DataTableColumn`
- **Type**: React component
- **Path**: `src/components/shared/data-table.tsx`
- **Purpose**: Admin list table with optional column sort toggles, actions column, and optional toolbar (`FilterBy`, search). Custom filter UI is defined per option via `DataTableFilterByOption.customInputComponent` (e.g. taxonomy status dropdown).
- **Scope**: Taxonomy list page; future paginated admin lists.
- **Dependencies**: shadcn `Table`, `ApiListQueryParams` sort fields.

### Asset: slugifyName
- **Name**: `slugifyName(text: string): string`
- **Type**: Utility function
- **Path**: `src/lib/utils/slug.ts`
- **Purpose**: Build slug from display name (`generateSlug` + `slugifyName` alias): trim, lowercase, remove Vietnamese accents (`đ/Đ -> d`), spaces/underscores → `-`, keep Unicode letters/numbers, collapse repeated dashes. Used for **read-only UI preview only**; persisted slugs are computed on BE (`utils.SlugifyName`).
- **Scope**: Taxonomy form dialog, tree editor, submit handlers.
- **Dependencies**: none.

### Asset: getCookieDomain
- **Name**: `getCookieDomain(rawDomain?: string): string | undefined`
- **Type**: Utility function
- **Path**: `src/lib/utils/cookie.ts`
- **Purpose**: Normalize the `AUTH_COOKIE_DOMAIN` env var into a parent domain string. Returns `undefined` on `localhost` so cookies are not domain-scoped during development.
- **Scope**: `src/actions/auth/auth.ts`, any Server Action that sets auth cookies.
- **Dependencies**: none.

### Asset: buildCookieOptions
- **Name**: `buildCookieOptions(input: BuildCookieOptionsInput)`
- **Type**: Utility function
- **Path**: `src/lib/utils/cookie.ts`
- **Purpose**: Returns a consistent cookie options object for `next/headers` `cookies().set()`. Non-HttpOnly by default so client JS can read the token and attach it to the Authorization header.
- **Scope**: `src/actions/auth/auth.ts`, any Server Action that sets auth cookies.
- **Dependencies**: none.
- **Note**: `buildHttpOnlyCookieOptions` is deprecated — use `buildCookieOptions` instead.

### Asset: pending-tab-auth-sync / useAuthConfirmTabSync
- **Path**: `src/lib/auth/pending-tab-auth-sync.ts`, `src/hooks/auth/use-auth-confirm-tab-sync.ts`
- **Purpose**: Defer page reload on background tabs until `visibilitychange` → `visible` after `confirm_success` broadcast.
- **Scope**: `AuthConfirmTabSync` in `AppProviders`.

### Asset: setAuthSessionCookies
- **Name**: `setAuthSessionCookies(input: SetAuthSessionCookiesInput): Promise<void>`
- **Type**: Server-only utility function
- **Path**: `src/lib/utils/auth-session.ts` — **not** re-exported from `@/lib/utils` (barrel is client-safe).
- **Purpose**: Writes `access_token`, `refresh_token`, and `session_id` cookies after login or email confirm. Uses `next/headers` `cookies()`.
- **Scope**: `src/actions/auth/auth.ts` (`loginAction`, `confirmAction`) only.
- **Import**: `import { setAuthSessionCookies } from "@/lib/utils/auth-session";`
- **Dependencies**: `server-only`, `next/headers`, `buildCookieOptions`, `getCookieDomain` from `./cookie`.

### Asset: getCookieValue / setCookieValue
- **Name**: `getCookieValue(name): Promise<string | null>`, `setCookieValue(name, value, options?): Promise<void>`
- **Type**: Isomorphic utility functions
- **Path**: `src/lib/utils/cookie.ts`
- **Purpose**: Unified cookie read/write that works on both client (via `js-cookie`) and server (via `next/headers`). Hides the environment-branching logic.
- **Scope**: Any isomorphic code that needs to read/write cookies (e.g. token extraction in interceptors).
- **Dependencies**: `js-cookie`, `next/headers`, `isServer`.

### Asset: pickCharacter
- **Name**: `pickCharacter(username: string): { label, color, backgroundColor }`
- **Type**: Utility function
- **Path**: `src/lib/utils/user.ts`
- **Purpose**: Derive a deterministic avatar fallback from a username — 1–2 letter label and a stable HSL color pair. Pure function, no I/O.
- **Scope**: Any avatar component that needs to show a fallback when no image is available.
- **Dependencies**: none.

### Asset: useUniqueId
- **Name**: `useUniqueId(prefix?: string): string`
- **Type**: React hook (utility)
- **Path**: `src/lib/utils/react.ts`
- **Purpose**: Stable, hydration-safe unique ID for DOM/SVG/a11y attributes. Combines React `useId` with FNV-1a noise. Never uses `Math.random()` in render.
- **Scope**: Any component needing a stable element ID.
- **Dependencies**: `react` (`useId`).

---

## Zod Schemas

### Asset: loginSchema / LoginFormValues
- **Name**: `loginSchema`, `LoginFormValues`
- **Type**: Zod schema + inferred type
- **Path**: `src/schema/auth/auth.ts`
- **Purpose**: Validates login form — `email`, `password`, `rememberMe`. Validation messages are i18n keys (`"validation.email"`, `"validation.password"`) — translated inside `auth-form-fields.tsx` (`resolveAuthValidationMessage`).
- **Scope**: `src/components/common/auth-menu/auth/login-content.tsx`.
- **Dependencies**: `zod`.
- **Reuse Rule**: Use `zodResolver(loginSchema)` with `react-hook-form`. Never re-define inline.

### Asset: signupSchema / SignupFormValues
- **Name**: `signupSchema`, `SignupFormValues`
- **Type**: Zod schema + inferred type
- **Path**: `src/schema/auth/auth.ts`
- **Purpose**: Validates signup form — `fullName`, `email`, `password`. Same i18n key pattern.
- **Scope**: `src/components/common/auth-menu/auth/signup-content.tsx`.
- **Dependencies**: `zod`.

---

## Zustand Stores

### Asset: useAuthStore
- **Name**: `useAuthStore`
- **Type**: Zustand store
- **Path**: `src/store/auth/auth.ts`
- **Purpose**: Tracks the active auth modal (`authAction`: none/login/signup/logout) and post-auth redirect path (`nextLink`). Methods: `openLoginModal(nextPath?)`, `openSignupModal(nextPath?)`, `closeAllModals()`.
- **Scope**: Any component that opens/closes auth modals or checks auth modal state.
- **Dependencies**: `zustand`.
- **Reuse Rule**: Do not use local state for auth modal visibility — always use `useAuthStore`.

### Asset: useMeStore
- **Name**: `useMeStore`
- **Type**: Zustand store
- **Path**: `src/store/auth/auth.ts`
- **Purpose**: Holds the current user (`me`), loading state, error, and permissions. Synced from SWR `useAuth` via `useSyncMeFromAuth` in `AppProviders`. Read from any component via `useGetMe()`.
- **Scope**: Any component that needs the current user without directly calling SWR.
- **Dependencies**: `zustand`, `swr` (for `mutate`).
- **Reuse Rule**: Always read the current user via `useGetMe()` (not `useAuth()` directly). Only `MeSwrSync` in `AppProviders` calls `useSyncMeFromAuth`.

### Asset: useApiError
- **Name**: `useApiError`
- **Type**: Zustand store
- **Path**: `src/store/api-error-store.ts`
- **Purpose**: Global API error log — populated automatically by the Axios response interceptor. Keeps at most 20 entries. Methods: `push(error)`, `remove(id)`, `clear()`.
- **Scope**: Error display components, toast-on-error listeners.
- **Dependencies**: `zustand`.

---

## React Hooks

### Asset: useAuth
- **Name**: `useAuth(): UseAuthReturn`
- **Type**: SWR hook
- **Path**: `src/api/hooks/auth/useAuth.ts`
- **Purpose**: Fetches `GET /api/v1/me` via SWR — returns `{ me, isLoading, error, mutate }`. Returns `null` for 401 (unauthenticated) without throwing. Auto-revalidates on window focus.
- **Scope**: `useSyncMeFromAuth` in `AppProviders` only. Do not call directly in feature components — use `useGetMe()` instead.
- **Dependencies**: `swr`, `getMeService`, `getMeEndpointKey`.

### Asset: useGetMe
- **Name**: `useGetMe(): MeStoreState`
- **Type**: Custom hook (Zustand selector)
- **Path**: `src/hooks/auth/use-auth-store.ts`
- **Purpose**: Read the current user from `useMeStore` with a shallow-equal selector. Returns `{ me, isLoading, isError, mePermissions, mutateMe }`.
- **Scope**: Any component that needs current user info (preferred over `useAuth`).
- **Dependencies**: `useMeStore`, `zustand/react/shallow`.

### Asset: useSyncMeFromAuth
- **Name**: `useSyncMeFromAuth(): void`
- **Type**: Custom hook
- **Path**: `src/hooks/auth/use-auth-store.ts`
- **Purpose**: Bridges SWR `useAuth` → `useMeStore`. Called once inside `MeSwrSync` component in `AppProviders`. Keeps global Zustand state in sync with SWR cache.
- **Scope**: `src/components/providers/app-providers.tsx` (`MeSwrSync`) only.
- **Dependencies**: `useAuth`, `useMeStore`.

### Asset: useLanguageStore
- **Name**: `useLanguageStore`
- **Type**: Zustand store
- **Path**: `src/store/language/language-store.ts`
- **Purpose**: `languageCode`, `locale`, `languageLabel`; `setFromLocale(locale)` updates from next-intl route locale.
- **Scope**: Sync via `useSyncLanguageFromLocale` only; read via `useCustomLanguage`.
- **Dependencies**: `resolveCustomLanguage`, `routing.defaultLocale`.

### Asset: useCustomLanguage
- **Name**: `useCustomLanguage(): { languageCode, locale, languageLabel }`
- **Type**: Custom hook
- **Path**: `src/hooks/language/use-custom-language.ts`
- **Purpose**: Shallow read of `useLanguageStore` for UI labels (locale switcher, etc.).
- **Scope**: Client components; prefer over prop-drilling locale from RSC.
- **Dependencies**: `useLanguageStore`.

### Asset: useSyncLanguageFromLocale
- **Name**: `useSyncLanguageFromLocale(): void`
- **Type**: Custom hook
- **Path**: `src/hooks/language/use-sync-language-from-locale.ts`
- **Purpose**: Mirrors `useLocale()` → `useLanguageStore`. Mounted in `LanguageLocaleSync` inside `AppProviders`.
- **Scope**: Provider sync only — do not call in feature components.
- **Dependencies**: `next-intl`, `useLanguageStore`.

### Asset: resolveCustomLanguage / resolveLanguageCode
- **Name**: `resolveCustomLanguage(locale)`, `resolveLanguageCode(locale)`, `AppLanguage`
- **Type**: Pure functions + type
- **Path**: `src/lib/language/resolve-language.ts`
- **Purpose**: Validate locale against `routing.locales`; map to `LANGUAGE_OPTIONS` label. Use in RSC when hooks are unavailable.
- **Scope**: Language store init, server layouts, tests.
- **Dependencies**: `LANGUAGE_OPTIONS`, `routing`.

### Asset: BROWSE_MENU_ITEMS
- **Name**: `BROWSE_MENU_ITEMS`
- **Type**: Constant tree
- **Path**: `src/constants/browse-menu.ts` (+ types in `src/types/browse-menu.ts`)
- **Purpose**: Static browse category tree for `HeaderBrowseNav` (desktop flyout) and `BrowseSidebarMenu` (mobile sidebar).
- **Scope**: Header browse UI only.
- **Dependencies**: `BrowseMenuItem` type.

---

## API Layer Functions

### Asset: axios-helpers (normalizeHeaders / parseSetCookies / buildAxiosConfigWithCookies)
- **Name**: `normalizeHeaders`, `parseSetCookies`, `buildAxiosConfigWithCookies`, `parseAxiosResponseMeta`
- **Type**: HTTP header/cookie utilities
- **Path**: `src/api/axios-helpers.ts`
- **Purpose**: Shared Axios config and response meta parsing for `methods.ts` and `raw-http.ts` (no `apiInstance` import — safe for refresh path).
- **Scope**: `src/api/methods.ts`, `src/api/raw-http.ts` only. **Do not duplicate** these helpers elsewhere.
- **Dependencies**: `axios` types only.

### Asset: apiFetch / apiPost / apiPut / apiDelete / apiOptions
- **Name**: `apiFetch<T>`, `apiPost<T,D>`, `apiPut<T,D>`, `apiDelete<T>`, `apiOptions<T>`
- **Type**: HTTP method wrappers
- **Path**: `src/api/methods.ts`
- **Purpose**: Thin wrappers around the shared Axios `apiInstance`. All return `ApiResult<T>` (data + statusCode + headers + cookies). Support `headers`, `cookies` (server-side forwarding), `params`, and `otherAxiosInstance` options.
- **Scope**: All API callers in `src/api/callers/**`. **Do not call `apiInstance.get/post/...` directly.**
- **Dependencies**: `apiInstance`, `ApiResult`, `axios-helpers`.

### Asset: AuthEmailPasswordFields / AuthFullNameField
- **Name**: `AuthEmailPasswordFields`, `AuthFullNameField`, `AuthEmailField`, `AuthPasswordField`
- **Type**: Auth form field components
- **Path**: `src/components/common/auth-menu/auth/auth-form-fields.tsx`
- **Purpose**: Shared styled inputs for login/signup modals; resolves Zod i18n validation keys via `useTranslations("auth")` when `FieldError.message` is present.
- **Scope**: `login-content.tsx`, `signup-content.tsx`. Pass `error` only — **do not** call `t(errors.*.message)` in parents (avoids `MISSING_MESSAGE` from `t(undefined)`).
- **Dependencies**: `InputGroup`, lucide icons, react-hook-form, `next-intl`.

### Asset: apiInstance
- **Name**: `apiInstance`
- **Type**: Axios instance
- **Path**: `src/api/instance.ts`
- **Purpose**: Shared Axios instance with: `baseURL` from `NEXT_PUBLIC_API_URL`/`API_URL`; request interceptor that attaches `access_token` cookie as `Authorization: Bearer`; response interceptor that detects `X-Token-Expired` header and performs transparent token refresh with client-side mutex (prevents refresh stampede).
- **Scope**: Used exclusively via `apiFetch`/`apiPost` etc. in `src/api/methods.ts`.
- **Dependencies**: `axios`, `js-cookie`, `getCookieValue`, `setCookieValue`, `isServer`, `useApiError`.

### Asset: Me API services
- **Name**: `getMeService`, `patchMeService`, `deleteMeService`, `hardDeleteMeService`, `getMyPermissionsService`, `getMeEndpointKey`
- **Type**: API services + SWR key
- **Path**: `src/api/callers/auth/auth.ts`
- **Purpose**: `GET /api/v1/me` returns `null` on 401; PATCH/DELETE/permissions for profile lifecycle. `getMeEndpointKey` is the canonical SWR cache key.
- **Scope**: `useAuth` hook (`errorCode` for non-401 failures); future account-settings UI.
- **Dependencies**: `apiFetch`, `apiPatch`, `apiDelete`, `buildQueryParams`, `API_PRIVATE_ROUTES.user`.

### Asset: loginService
- **Name**: `loginService(payload: LoginPayload): Promise<{ data, cookies }>`
- **Type**: API service
- **Path**: `src/api/callers/auth/auth.ts`
- **Purpose**: Calls `POST /api/v1/auth/login`. Returns both the response body (`data`) and parsed `Set-Cookie` headers (`cookies`) so the Server Action can re-set cookies for the browser.
- **Scope**: `loginAction` Server Action.
- **Dependencies**: `apiPost`, `API_PUBLIC_ROUTES`.

---

## Server Actions

### Asset: loginAction
- **Name**: `loginAction(payload: LoginPayload): Promise<AuthActionResult>`
- **Type**: Next.js Server Action (`"use server"`)
- **Path**: `src/actions/auth/auth.ts`
- **Purpose**: Handles login end-to-end on the server — calls `loginService`, sets `access_token`, `refresh_token`, `session_id` cookies for the browser, and returns `AuthActionResult`. Cookies are non-HttpOnly so client JS can read them for `Authorization` header attachment.
- **Scope**: Login form's `onSubmit` handler in `login-content.tsx`. UI maps `result.code` via `translateApiErrorCode` — never `result.message`.
- **Dependencies**: `loginService`, `buildCookieOptions`, `getCookieDomain`, `next/headers cookies()`.

### Asset: registerAction / confirmAction
- **Name**: `registerAction`, `confirmAction`, `setAuthSessionCookies`
- **Type**: Next.js Server Action (`"use server"`)
- **Path**: `src/actions/auth/auth.ts`
- **Purpose**: Register (201, no cookies) and confirm (tokens + cookies via `setAuthSessionCookies` in `@/lib/utils/auth-session`).
- **Scope**: `signup-content.tsx`, `confirm-email-content.tsx`, `login-content.tsx` (resend).
- **Dependencies**: none (yet).

---

## Supporting Type Utilities

### Asset: isApiSuccess
- **Name**: `isApiSuccess<T>(res: ApiResponse<T>): boolean`
- **Type**: Type guard function
- **Path**: `src/lib/utils/api.ts`
- **Purpose**: Returns `true` and narrows type to `ApiResponse<T> & { data: T }` when `res.code === 0`. Use instead of comparing `res.code === ApiErrorCode.Success` directly.
- **Scope**: All API service functions and Server Actions that check response success.
- **Dependencies**: `ApiErrorCode` (`src/constants/api-error-code.ts`), `ApiResponse` type.

### Asset: toastApiError / translateApiErrorCode
- **Name**: `toastApiError`, `translateApiErrorCode`, `extractAxiosApiError`, `resolveApiErrorMessageKey`
- **Type**: Utility functions
- **Path**: `src/lib/utils/api-error.ts` (barrel: `@/lib/utils`)
- **Purpose**: Unified API error resolver — maps `response.code` → `errors.codes.{code}` i18n key. Never passes BE `message` to UI.
- **Scope**: Auth, Me, Media, Taxonomy, Instructor, Course — all `catch` blocks after API calls.
- **Dependencies**: `src/messages/error-codes.ts`, `ApiErrorCode`.

### Asset: RequiredLabel / FieldError
- **Name**: `RequiredLabel`, `FieldError`
- **Type**: React components
- **Path**: `src/components/shared/required-label.tsx`, `src/components/shared/field-error.tsx`
- **Purpose**: Form labels with required asterisk; inline Zod field errors below controls.
- **Scope**: Taxonomy form dialog, instructor/course dialogs, any new forms.
- **Dependencies**: `Label` from `@/components/ui/label`.

### Asset: resolveValidationMessage
- **Name**: `resolveValidationMessage`
- **Type**: Utility function
- **Path**: `src/lib/utils/validation-message.ts`
- **Purpose**: Translates Zod i18n message keys through module-scoped `useTranslations` (e.g. `taxonomy.form.validation.*`).
- **Scope**: All Zod + react-hook-form forms.
- **Dependencies**: none.

### Asset: Zod schemas (`src/schema/`)
- **Name**: Module schemas (`auth`, `me`, `media`, `taxonomy`, `instructor`, `course`)
- **Type**: Zod schemas
- **Path**: `src/schema/**` (barrel: `@/schema`)
- **Purpose**: FE pre-submit validation with i18n keys separate from `errors.codes.*`.
- **Scope**: Forms across Auth, Me, Media, Taxonomy, Instructor, Course modules.
- **Dependencies**: `zod`.

---

## Stream events (realtime)

### Asset: StreamEvent / StreamOutboundEvent
- **Name**: `StreamEvent`, `StreamOutboundEvent`
- **Type**: Discriminated union (data type)
- **Path**: `src/types/events/stream-events.ts`
- **Purpose**: All normalized inbound events and all outbound envelopes across channels.
- **Scope**: Transports, store, hooks, feature handlers.
- **Dependencies**: Per-channel types in `broadcast`, `sse`, `socket`, `gRPC`.

### Asset: StreamInboundEventOf / StreamOutboundEventOf
- **Name**: `StreamInboundEventOf<S, M>`, `StreamOutboundEventOf<S, M>`
- **Type**: Generic type builder
- **Path**: `src/types/events/common.ts`
- **Purpose**: Build channel events from `{ type: Payload }` map without repeating four fields per variant.
- **Scope**: `src/types/events/*/index.ts`
- **Dependencies**: `StreamInboundMetadata`, `StreamOutboundMetadata`, `StreamEventSource`.

### Asset: StreamChannelEventMap / StreamWebSocketEventMap / SseInboundEventMap
- **Name**: Channel payload maps
- **Type**: Data type maps
- **Path**: `src/types/events/payloads.ts`
- **Purpose**: Shared `notification`/`hello`; WS adds `ping`/`pong`; SSE inbound adds `pong` only.
- **Scope**: SSE, WebSocket, gRPC type aliases.
- **Dependencies**: `StreamHelloPayload`, `StreamNotificationPayload`, `StreamPingPayload`, `StreamPongPayload`.

### Asset: STREAM_ENV_KEYS / STREAM_EVENTS_LOG_MAX
- **Name**: `STREAM_ENV_KEYS`, `STREAM_EVENTS_LOG_MAX`
- **Type**: Constant
- **Path**: `src/constants/events/index.ts`
- **Purpose**: Env key names for stream URLs; max events in Zustand log (100).
- **Scope**: `src/config/events/*`, `stream-events-store.ts`
- **Dependencies**: none

### Asset: normalizeInboundEnvelope
- **Name**: `normalizeInboundEnvelope(raw, options)`
- **Type**: Function
- **Path**: `src/events/core/normalize-inbound.ts`
- **Purpose**: Parse unknown JSON → `StreamEvent | null` with Zod per `(source, type)`.
- **Scope**: `publishRawStreamPayload` only (do not call from UI).
- **Dependencies**: `zod`, `makeStreamEventCode`, channel Zod schemas.

### Asset: publishRawStreamPayload
- **Name**: `publishRawStreamPayload(raw, defaultSource?)`
- **Type**: Function
- **Path**: `src/events/core/publish.ts`
- **Purpose**: Normalize → push store → notify subscribers.
- **Scope**: All transports.
- **Dependencies**: `normalizeInboundEnvelope`, `useStreamEventsStore`, `emitStreamEventToSubscribers`.

### Asset: subscribeStreamEvents / emitStreamEventToSubscribers
- **Name**: `subscribeStreamEvents`, `emitStreamEventToSubscribers`
- **Type**: Function
- **Path**: `src/events/core/subscribe.ts`
- **Purpose**: In-process pub/sub after store ingest. Hỗ trợ `{ filter, order, handler }` — nhiều handler cùng key, gọi theo `order` tăng dần (cùng `order` → FIFO đăng ký).
- **Scope**: `useStreamEvent` hook; có thể gọi trực tiếp ngoài React.
- **Dependencies**: `StreamEvent`, `StreamEventFilter`.

### Asset: nextStreamOutboundMetadata
- **Name**: `nextStreamOutboundMetadata()`
- **Type**: Function
- **Path**: `src/events/core/outbound-metadata.ts`
- **Purpose**: `{ timestamp, seq }` for outbound messages (no `code`).
- **Scope**: `postSocketOutbound`, `postBroadcastOutbound`, hooks.
- **Dependencies**: `useStreamEventsStore.nextClientSeq`.

### Asset: makeStreamEventCode
- **Name**: `makeStreamEventCode(source, type)`
- **Type**: Function
- **Path**: `src/events/core/event-code.ts`
- **Purpose**: Build `metadata.code` as `source:type` when missing on inbound.
- **Scope**: `normalize-inbound.ts`
- **Dependencies**: none

### Asset: useStreamEventsStore
- **Name**: `useStreamEventsStore`
- **Type**: Zustand store
- **Path**: `src/store/events/stream-events-store.ts`
- **Purpose**: `clientSeq`, `last`, `log`, `push`, `nextClientSeq`.
- **Scope**: Publish pipeline, debug selectors.
- **Dependencies**: `STREAM_EVENTS_LOG_MAX`.

### Asset: useStreamEvent
- **Name**: `useStreamEvent(filter, input)`
- **Type**: Hook
- **Path**: `src/hooks/events/use-stream-event.ts`
- **Purpose**: Subscribe with optional `source` / `type` filter. `input` = một function, `{ order, handler }`, hoặc mảng nhiều `{ order, handler }` cho cùng filter.
- **Scope**: Channel-specific hooks (`useSseStreamEvent`, …).
- **Dependencies**: `subscribeStreamEvents`, `StreamEventSubscribeInput`, `StreamEventListenerRegistration`.

### Asset: useWebSocketStreamEvent / useSseStreamEvent / useGrpcStreamEvent / useBroadcastStreamEvent
- **Name**: Per-channel listen hooks
- **Type**: Hook
- **Path**: `src/hooks/events/{socket,sse,gRPC,broadcast}/`
- **Purpose**: Typed handler for one channel (+ optional type).
- **Scope**: Feature components.
- **Dependencies**: `useStreamEvent`.

### Asset: useSendBroadcastOutbound
- **Name**: `useSendBroadcastOutbound()`
- **Type**: Hook
- **Path**: `src/hooks/events/broadcast/use-send-broadcast-outbound.ts`
- **Purpose**: Send `BroadcastOutboundEvent` with auto metadata.
- **Scope**: Cross-tab logout / confirm.
- **Dependencies**: `postBroadcastOutbound`, `nextStreamOutboundMetadata`.

### Asset: postSocketOutbound / postBroadcastOutbound
- **Name**: `postSocketOutbound`, `postBroadcastOutbound`
- **Type**: Function
- **Path**: `src/events/socket/socket-transport.ts`, `src/events/broadcast/broadcast-transport.ts`
- **Purpose**: Send outbound JSON on live transport.
- **Scope**: Hooks, transport auto-pong.
- **Dependencies**: Channel config, typed outbound events.

### Asset: startStreamEventTransports
- **Name**: `startStreamEventTransports()`
- **Type**: Function
- **Path**: `src/events/registry/start-stream-transports.ts`
- **Purpose**: Start all enabled transports; returns combined cleanup.
- **Scope**: `EventsStreamProvider`.
- **Dependencies**: `startBroadcastTransport`, `startSseTransport`, `startSocketTransport`, `startGrpcNdjsonTransport`.

---

## Gap Analysis (What Must Be Created Later)

- `useSendWebSocketOutbound` hook (mirror broadcast) if many call sites send WS messages.
- Shared form error display component.
- Reusable paginated list hook when list endpoints are implemented.
- Course, lesson, enrollment types and service callers (Phase 02+).

## Additional audited reusable assets

### Asset: ApiErrorCodeValue
- Name: `ApiErrorCodeValue`
- Type: Data type
- File path: `src/types/api.ts`
- Purpose: Union of all values inside `ApiErrorCode` map.
- Reusability scope: Any typed API error handling code.
- Dependencies: `ApiErrorCode` from `src/constants/api-error-code.ts` (value import allowed in type files).

### Asset: ApiHealthResponse
- Name: `ApiHealthResponse`
- Type: Data type
- File path: `src/types/api.ts`
- Purpose: Typed response envelope for health endpoint.
- Reusability scope: Health check integrations.
- Dependencies: none.

### Asset: BuildHttpOnlyCookieOptionsInput
- Name: `BuildHttpOnlyCookieOptionsInput`
- Type: Data type
- File path: `src/lib/utils/cookie.ts`
- Purpose: Legacy input type for httpOnly cookie option builder.
- Reusability scope: Transitional compatibility in auth cookie options.
- Dependencies: `CookieSameSite`.

### Asset: BuildCookieOptionsInput
- Name: `BuildCookieOptionsInput`
- Type: Data type
- File path: `src/lib/utils/cookie.ts`
- Purpose: Input contract for `buildCookieOptions`.
- Reusability scope: All server actions and cookie writers.
- Dependencies: `CookieSameSite`.

### Asset: CookieSameSite
- Name: `CookieSameSite`
- Type: Data type
- File path: `src/lib/utils/cookie.ts`
- Purpose: Shared same-site cookie policy enum type.
- Reusability scope: Cookie option definitions.
- Dependencies: none.
