# Modules (`fe-mycourse`)

_Last audited: 2026-07-08 (Auth module: Discord + Google on popup; X OAuth code retained). Prior: 2026-06-17 (course read-path performance: `include_outline`, `include_images`, browser-verified info tab)._


## Module map
- `Ui`: `src/components`, `src/screen`, `src/app/[locale]/(web)`, `src/app/[locale]/{admin,instructor,sysadmin}` (dashboard shells)
- `Auth`: `src/actions/auth` (incl. `google-oauth.ts`, `discord-oauth.ts`, `x-oauth.ts`), `src/components/common/auth-menu` (incl. `auth-social-login`), `src/components/providers/google-one-tap-host.tsx`, `src/hooks/auth` (incl. `use-google-login`, `use-google-one-tap`, `use-discord-login`, `use-x-login`, `use-oauth-post-auth`), `src/app/auth/discord/callback`, `src/app/auth/x/callback`, `src/lib/utils/auth-action.ts`, `src/schema/auth`, `src/types/auth` (incl. `google-oauth.ts`)
- `Api`: `src/api`, `src/constants/api-route.ts`, `src/constants/api-error-code.ts`, `src/types/api.ts`, `src/lib/utils/api.ts`, `src/lib/utils/api-error.ts`
- `Validation + i18n errors`: `src/schema/**`, `src/messages/error-codes.ts`, `src/components/shared/required-label.tsx`, `src/components/shared/field-error.tsx`, `src/lib/utils/validation-message.ts`
- `Events`: `src/events`, `src/hooks/events`, `src/store/events`, `src/types/events`, `src/config/events`
- `State`: `src/store` (auth, language, api-error, events), `src/hooks/auth`, `src/hooks/language`
- `Routing + i18n`: `src/app`, `src/i18n`, `src/proxy.ts`, `src/messages`
- `Shared`: `src/lib/utils`, `src/constants`, `src/config`
- `Taxonomy`: `src/types/taxonomy`, `src/constants/taxonomy`, `src/api/callers/taxonomy`, `src/components/features/taxonomy`, `src/screen/common/taxonomy`, app routes under `admin/taxonomy/*` and `sysadmin/taxonomy/*`
- `Media`: `src/types/media`, `src/constants/media`, `src/api/callers/media`, `src/components/features/media` (collection popup; no dedicated route page yet)
- `Instructor application (user)`: `src/lib/instructor-application/`, `src/screen/common/instructor/become-instructor-page.tsx`, route `(web)/become-instructor` — see `docs/instructor-application.md`
- `Instructor`: `src/types/instructor.ts`, `src/constants/instructor`, `src/api/callers/instructor`, `src/api/hooks/instructor`, `src/components/features/instructor`, `src/screen/common/instructor`, `src/screen/instructor/tickets`, app routes under `admin/instructors/*`, `sysadmin/instructors/*`, `instructor/tickets`
- `Course`: `src/types/course.ts`, `src/api/callers/course`, `src/api/hooks/course`, `src/components/features/course`, `src/screen/instructor/courses`, `src/screen/common/course`, app routes under `instructor/courses/*`, `admin/courses/{all,reviewing,trash}`, `sysadmin/courses/{all,reviewing,trash,reviewing/[courseId]/preview}`

## Responsibilities
- `Ui` renders pages/sections and calls hooks/actions.
- `Auth` handles login/signup/confirm/logout **and Google / Discord / X (Twitter) OAuth** flows plus auth modal behavior. The login/signup popup wires **Discord + Google** only; X API/actions/hooks remain for backward compatibility. API failures use `errors.codes.{code}` (never BE `message`).
- `Api` centralizes HTTP transport, retries, endpoint access, and unified error resolution (`toastApiError`, `translateApiErrorCode`).
- `Validation + i18n errors` provides shared Zod schemas, form labels (`RequiredLabel`), field errors (`FieldError`), and two i18n namespaces: `errors.codes.*` (API) vs `*.validation.*` (pre-submit).
- `Events` manages realtime transports (BroadcastChannel, SSE, WebSocket, NDJSON gRPC), normalization, and hook subscriptions.
- `State` stores auth modal state, `/me` sync, **language** (`useLanguageStore`), API errors, and stream event log.
- `Routing + i18n` controls locale-prefixed navigation and message loading.
- `Shared` exposes reusable helpers/types/constants (`lib/language`, `constants/browse-menu.ts`, …).
- `Taxonomy` provides admin CRUD for levels/topics/outcomes/skills/tags; list filters reuse `ApiListQueryParams` and extend with taxonomy typed-search (`search_by`, `search_value`).
- `Media` provides the reusable media library dialog (browse/upload/select); taxonomy cover images use it. List filters extend `ApiListQueryParams` with `category` / `sort_order`.
- `Course` provides instructor course CRUD, draft editing tabs, outline sorting, collaborator management (role label **Cộng tác viên** / **Collaborator** for `EDITOR`), and admin/sysadmin review actions. Review workflow buttons (prepare / submit / reopen) are **owner-only** in UI and API. Admin catalog, trash, and review queue tables use `CourseListItem.owner_display_name` for the owner column (fallback `owner_user_id`).

## Taxonomy module

- **Types**: `src/types/taxonomy/` — entities, `TaxonomyResourceConfig`, `TaxonomyListColumn`; `TaxonomyListFilters` extends `ApiListQueryParams` with `search_by` / `search_value`.
- **Constants**: `src/constants/taxonomy/resources.ts` — `TAXONOMY_RESOURCES`, `TAXONOMY_RESOURCE_KEYS`, `TAXONOMY_GROUP_READ_PERMISSIONS` (data only).
- **Utils**: `src/lib/utils/taxonomy.ts` — `getTaxonomyResourceConfig()`, `getTaxonomySearchableColumns()`, `getTaxonomyTreeFromEntity()`, `buildTaxonomyDagreRoot()`, `countTaxonomyTreeNodes()`; `src/lib/utils/dagre-tree.ts` — read-only tree layout helpers.
- **Nav**: `src/constants/dashboard/taxonomy-icons.ts` (`TAXONOMY_MENU_ICONS`) + taxonomy nodes in `admin-items.ts` / `sysadmin-items.ts`; filtered by `useFilteredDashboardItems`.
- **API**: `src/api/callers/taxonomy/taxonomy.ts`, `src/api/hooks/taxonomy/useTaxonomy.ts`, shared SWR normalizers in `src/api/hooks/shared.ts`.
- **UI**: `src/screen/common/taxonomy/taxonomy-list-page.tsx` (`TaxonomyListPage`), app routes under `src/app/[locale]/{admin,sysadmin}/taxonomy/*/page.tsx`, `src/components/features/taxonomy/*` (incl. `TaxonomyTreeViewButton` with `nodesDraggable={false}`, `child_render` column), shared `DagreTreeDialog`, `ConfirmDeleteDialog`.
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
- **API**: `src/api/callers/instructor/instructor.ts`, `src/api/hooks/instructor/*`, shared SWR normalizers in `src/api/hooks/shared.ts`; routes in `API_PRIVATE_ROUTES.instructor`.
- **UI**: `src/screen/common/instructor/*` (shared pages), `src/screen/instructor/tickets/page.tsx`, app routes under `src/app/[locale]/{admin,sysadmin}/instructors/*/page.tsx`; `src/components/features/instructor/*`.
- **Docs**: `docs/instructor-admin.md` (admin routes, permissions, ADM enhancements), **`docs/instructor-application.md`** (user become-instructor page).

## Course module

- **Types**: `src/types/course.ts` — version status, `CourseDetail.last_rejection_reason`, outline nodes (`estimated_duration_ms` on section/lesson/sub-lesson), collaborators, leases, learner progress, request payloads (`UpsertCourseSubLessonPayload.estimated_duration_ms` optional for TEXT/QUIZ).
- **API**: `src/api/callers/course/course.ts` (`getCourseDetailKey` / `getCourseDetailService` accept `{ includeOutline?: boolean }` → query `include_outline=false` when omitted on info/collaborators tabs; `deleteCourseSectionService` → `DELETE /api/v1/courses/:courseId/sections/:sectionId`, returns updated `CourseSection[]`), `src/api/hooks/course/useCourses.ts` (`useCourseDetail(courseId, { includeOutline })`); routes under `API_PRIVATE_ROUTES.course`.
- **UI**:
  - `src/screen/instructor/courses/page.tsx` — editable course list + create/delete owner flow
  - `src/screen/instructor/courses/editor-page.tsx` — editor shell, status header (edit `version_no` badge + optional `publishedVersionBadge` when both draft and live exist), route-backed tab panels; `useCourseDetail(courseId)` single SWR cache (tab switch = no refetch); taxonomy lists on **info** tab only (`include_images: false`); `editable` only when `draft_version.status === "DRAFT"`; shows `last_rejection_reason` after reject-fork
  - `src/screen/common/course/course-review-page.tsx` — shared admin/sysadmin review queue (⋮ `CourseReviewRowActions` → approve/reject `Dialog`; non-modal menu + deferred `onSelect`)
  - `src/screen/common/course/course-admin-all-page.tsx` — catalog + move to trash (`ConfirmDeleteDialog`)
  - `src/screen/common/course/course-admin-trash-page.tsx` — restore / permanent delete
  - `src/components/features/course/course-status-badge.tsx`
  - `src/components/shared/delta-editor.tsx` — shared WYSIWYG `DeltaEditor` + read-only `DeltaViewer` (Delta JSON; font picker; inline image/video via toolbar, paste, or drag-and-drop; embed × remove; `onObjectEmbedded` / `onDelete`)
  - `src/lib/quill/` — Quill blots, toolbar, paste/drop, embed-remove helpers + `delta-editor.css`; **`ensureQuillLoaded()`** dynamic-imports Quill on the client (SSR-safe)
  - `src/hooks/quill/use-delta-editor-media-handlers.ts` — shared upload/delete callbacks wired into course editor `DeltaEditor` instances
  - `src/lib/utils/course-delta.ts` — shared Delta parse/stringify/text/embed-diff helpers for validation and editor state
  - `src/lib/utils/duration.ts` — ms ↔ H/M/S conversion; `formatDurationMs` + `buildDurationUnits` (suffixes from `course.common.durationUnit*` i18n keys)
  - `src/lib/utils/course.ts` — course editor tab registry, form state factories (`duration_hours` / `duration_minutes` / `duration_seconds` UI fields), `buildSubLessonEstimatedDurationPayload`, `validateSubLessonDurationForm`, payload mapping, outline stable-id helpers, and optimistic outline reorder patch/merge helpers (`assignSequentialOrderIndex`, `replaceSectionLessons`, `mergeReorderedLessons`, `mergeReorderedSections`, …)
  - `src/components/features/course/course-editor-basic-tab.tsx`, `course-editor-outline-tab.tsx`, `course-editor-outline-row-actions.tsx`, `course-editor-collaborators-tab.tsx`, `course-editor-dialogs.tsx` — split editor render helpers kept outside `src/screen/**` to satisfy the page-only screen rule; tab components receive grouped `state` / `taxonomyRows|data` / `actions` props instead of long flat prop lists; outline row mutations share `CourseOutlineRowActions` (`modal={false}` + `DeferredDropdownMenuItem`; `CourseOutlineItemKind`: section / lesson / item)
  - `src/components/features/instructor/instructor-course-editor-route.tsx` — shared route renderer reused by the 5 App Router course editor pages so route glue stays out of `src/app/**`
  - `src/components/features/instructor/instructor-action-controls.tsx` — shared instructor admin action/footer helpers
  - `src/components/features/instructor/instructor-list-pagination.tsx` — shared instructor/admin/sysadmin pagination helper
- **Hooks**:
  - `src/hooks/course/use-course-editor-state.ts` — shared client editor state, lease lifecycle, pre-submit Zod checks (`course.validation.*`), API errors via `toastApiError` (including `withEphemeralLease` outline delete failures), and course draft mutation orchestration; `useCourseBasicInfoState` keeps `expected_row_version` aligned with `draft_version.row_version` after each successful save (SWR `mutateDetail` + render sync) so consecutive basic-info saves do not send a stale optimistic lock
  - `src/hooks/course/use-course-outline-reorder.ts` — optimistic section/lesson/sub-lesson reorder: SWR `mutateDetail` updates outline order immediately, then lease + reorder API; success toast + merge via `mergeReorderedLessons` / `mergeReorderedSections` (preserves nested items when API omits them); failure toast + revert cached snapshot
- **Validation**: `src/schema/course/course.ts` — `courseBasicInfoSchema` mirrors BE basic-info rules (title ≥5 non-whitespace, editable on save; short description ≥20; about course ≥30 via Delta JSON using `countDeltaNonWhitespace`; required thumbnail, level, topic, tags ≥1, skills ≥1, exactly one outcome; preview video optional; `expected_row_version` min 1). Create dialog uses `courseCreateSchema` (title ≥5 non-whitespace). Outline: section title ≥5 + description Delta ≥20 (`countDeltaNonWhitespace`); lesson title ≥5 + summary Delta ≥20; sub-lesson title ≥5. TEXT/QUIZ sub-lesson duration: H/M/S form fields validated by `validateSubLessonDurationForm` in `src/lib/utils/course.ts` (`0`–`999h` in ms; `course.validation.subLessonDurationInvalid`). VIDEO omits duration from save payload; duration shown read-only from selected `MediaFile.duration`. `courseQuizOptionSchema` validates QUIZ prompt/options (`allow_multiple`, `is_correct`, ≥1 correct answer, single-choice exactly one correct) and is reused by `validateSubLessonFormContent` / `validateCourseSubmitReadiness` in `src/lib/utils/course.ts`. QUIZ items cannot be preview (checkbox hidden; BE rejects). `course-editor-basic-tab.tsx` uses `DeltaEditor` (Quill + Delta JSON) for about course; `course-editor-dialogs.tsx` uses shared `CourseOutlineItemDialog` for section/lesson create-edit with `DeltaEditor` (`allowMediaEmbed={false}`) for description/summary; TEXT/QUIZ sub-lessons include shared `SubLessonDurationFields`; TEXT sub-lessons keep full media-enabled `DeltaEditor`; QUIZ sub-lesson dialog uses `applyQuizAllowMultipleChange` / `applyQuizOptionCorrectChange` for correct-answer UI. Outline cards preview description/summary via `extractDeltaPreviewText` and show rolled-up `formatDurationMs` labels when `estimated_duration_ms > 0`. Single-outcome `Select`, `react-hook-form + zodResolver`, and `toastValidationError` on invalid submit; `toUpdateCourseBasicInfoPayload` sends all required fields including `title`.
- **Reuse points**:
  - `SortableList` for section / lesson / sub-lesson ordering (mobile: `TouchSensor` + 44px grip handle)
  - `MediaCollectionDialog` + `ImageFileField` for thumbnail / preview video / Quill toolbar image & video embeds
  - `useTaxonomyList` for metadata pickers (info tab: `per_page: 100`, `include_images: false`)
  - `useCourseCollaborators` + `useCourseInstructorCandidates` for collaborator list / picker (P67 `course_collaborator_candidate:read`; replaces `useInstructorRosterList` P41)
  - `useCourseCollaboratorActions` + `finalizeBulkUserPickerSubmit` for bulk add partial-success UX (shared with instructor roster page)
  - `next-intl` message dictionaries in `src/messages/{en,vi}.ts` for all course editor, review, badge, and menu copy

## Authorization constants & hooks

- **Constants**: `PERMISSIONS` (67 names), `PERMISSION_IDS` (P1–P67), `ROLES` in `src/constants/` — mirror BE `AllPermissions` and role tags.
- **Types**: `PermissionName`, `PermissionId`, `RoleName` in `src/types/permissions/`.
- **Utils**: `PERMISSION_NAME_TO_ID`, `permissionIdFromName`, `permissionNameFromId` in `src/lib/utils/permission.ts`.
- **Utils**: `src/lib/utils/permission.ts` — `hasAllPermissions` matches BE `RequirePermission` (AND semantics); `filterPermissionNavTree` deep-filters nested nav (dashboard + user menu).
- **Utils**: `src/lib/utils/dashboard.ts` — `filterDashboardItems` wraps `filterPermissionNavTree` for `DashboardItem[]`.
- **Hooks**: `src/hooks/auth/use-permissions.ts` — `useHasPermission`, `useHasAll/AnyPermissions`, `useSatisfiesPermissions`, `useFilteredUserMenuGroups`, `useFilteredDashboardItems` over `useGetMe().mePermissions`.
- **UI**: `PermissionGate` (`src/components/shared/permission-gate.tsx`); user menu via `useFilteredUserMenuGroups` in `UserMenuDropdownItems`; dashboard sidebar via `useFilteredDashboardItems` in `DashboardLayout`.
- **Note**: `MeResponse` has `permissions: string[]` only; no `roles[]` on `/me` yet — gate UI by permission, not role name alone.

## Me API module

- **Routes**: `API_PRIVATE_ROUTES.user` — `getMe`, `patchMe`, `deleteMe`, `hardDeleteMe`, `getMyPermissions`.
- **Callers**: `src/api/callers/auth/auth.ts` — `getMeService`, `patchMeService`, `deleteMeService`, `hardDeleteMeService`, `getMyPermissionsService`.
- **Hook**: `useAuth` exposes `{ me, isLoading, error, errorCode, mutate }`; 401 on GET `/me` → `null` (not an error).
- **Schema**: `src/schema/me/me.ts` — `updateMeSchema` (`avatar_file_id` optional UUID).
- **UI**: No dedicated account-settings page yet; callers ready for avatar PATCH via `MediaCollectionDialog`.

## Auth OAuth module (Google + Discord + X social login)

> **Popup:** `AuthSocialLogin` shows **Discord + Google** on login/signup modals. X OAuth code (`x-oauth.ts`, `use-x-login.ts`, `/auth/x/callback`) is retained but not wired to the popup.

- **Shared popup utilities**: `src/lib/utils/oauth-popup-cookies.ts` (state cookie options/clear/read), `src/hooks/auth/use-oauth-popup-login.ts` (generic popup + `postMessage` relay), `src/components/auth/oauth-popup-callback-relay.tsx` (shared callback page relay). Discord and X provider actions/hooks compose these instead of duplicating cookie/popup logic.
- **Shared finalizer**: `src/lib/utils/auth-action.ts` — `finalizeAuthLoginAction` (sets session cookies via `setAuthSessionCookies` on success) + `mapAuthAxiosError`. Reused by `loginAction`, `confirmAction`, and every OAuth action.
- **Callers**: `src/api/callers/auth/auth.ts` — `googleLoginService`, `googleOneTapService`, `discordLoginService`, `xLoginService`; routes in `API_PUBLIC_ROUTES.auth` (`google`, `googleOnetap`, `discord`, `x`). The BE `/api/v1/auth/google/mobile` endpoint is a native-mobile-only contract and is intentionally not in the web route map.
- **Hooks**: `src/hooks/auth/use-google-login.ts`, `use-google-one-tap.ts`, `use-discord-login.ts`, `use-x-login.ts`, `use-oauth-post-auth.ts`. Google uses the GSI code-client popup / One Tap prompt; Discord uses an OAuth popup + `postMessage` relay with `state` stored in short-lived HttpOnly cookies (no PKCE); X uses PKCE + state (retained, not on popup).
- **UI**: `AuthSocialLogin` (`src/components/common/auth-menu/auth-social-login/`) wired by `LoginContent` / `SignupContent` with `useDiscordLogin` + `useGoogleLogin`; `GoogleOneTapHost` (`src/components/providers/google-one-tap-host.tsx`) mounted in `(web)/layout.tsx` for guests; GSI script loaded in `(web)/layout.tsx` only.
- **Discord callback URL**: FE `startDiscordLoginAction` uses canonical `NEXT_PUBLIC_DISCORD_CALLBACK_URL` (must match BE `DISCORD_CALLBACK_URL` exactly). Do not derive `redirect_uri` from request headers.
- **X callback URL**: FE `startXLoginAction` uses canonical `NEXT_PUBLIC_X_CALLBACK_URL` (must match BE `X_CALLBACK_URL` exactly). Retained for X OAuth code path.
- **FE-local error codes** (not in BE/Swagger): `4018` invalid OAuth state; `4020` Google not configured; `4021` popup blocked; `4022` X start failed; `4026` Discord start failed (missing client id or callback URL).
- **Callback routes**: `src/app/auth/discord/callback/page.tsx` (popup relay for Discord); `src/app/auth/x/callback/page.tsx` (retained for X).
- **Types**: `src/types/auth/google-oauth.ts` (GSI window client types).
- **Error codes**: `ApiErrorCode` 4013–4019, 4023–4025 (`InvalidGoogleCode`, `GoogleEmailNotVerified`, `OAuthIdentityConflict`, `InvalidXCode`, `XEmailUnavailable`, `InvalidOAuthState` — **4018 FE-local only**, `XAccountLinkRequired`, `InvalidDiscordCode`, `DiscordEmailNotVerified`, `DiscordEmailUnavailable`); resolved via `errors.codes.*`. Success/cancel toasts use `auth.socialLogin.*`.

## Cross-module contracts
- `Auth UI -> actions/auth/auth-client -> actions/auth -> api/callers` for login/signup submit; UI maps `result.code` via `translateApiErrorCode(tErrors, code)`.
- `OAuth: AuthSocialLogin / GoogleOneTapHost -> hooks/auth (useDiscordLogin | useGoogleLogin | useGoogleOneTap [| useXLogin retained]) -> actions/auth/{discord-oauth,google-oauth,x-oauth} -> lib/utils/auth-action (finalizeAuthLoginAction) -> api/callers/auth`; success runs `useOAuthPostAuth` (`mutateMe` + close modal + push `nextLink`).
- `api/hooks/auth/useAuth -> hooks/auth/use-auth-store` for SWR-to-Zustand sync.
- All feature `catch` blocks after API calls → `toastApiError(useTranslations("errors.codes"), error)` (Auth, Media, Taxonomy, Instructor, Course).
- `api/instance` depends on `lib/utils/cookie` for isomorphic token read/write.
- `AppProviders -> EventsStreamProvider -> events/registry` starts transports; transports call `events/core/publish` → `store/events`.
- Feature UI listens via `hooks/events/*` with shared source-scoping helpers under `src/hooks/events/internal/` (never import transports directly except outbound helpers).

## Events module detail

See [`delivery.md`](./delivery.md) and [`folder-structure.md`](./folder-structure.md) (`src/events/` tree).
