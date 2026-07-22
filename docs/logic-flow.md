# Logic Flow

_Last audited: 2026-07-08 (Discord + Google OAuth on popup; X code retained). Prior: 2026-06-26 (course admin ⋮ menu → dialog: `modal={false}` + deferred `onSelect` so `body` stays clickable after approve/trash flows). Prior: course version numbering §13, reject-fork draft, reorder nested merge._


Key execution paths and control flows in `fe-mycourse`. Covers auth, token lifecycle, data fetching, and form submission patterns.

---

## 1. Login Flow

```
User clicks "Login" button
  ↓
useAuthStore.openLoginModal()   [src/store/auth/auth.ts]
  → authAction = "login"
  ↓
LoginSignupPopup renders LoginContent   [src/components/common/auth-menu/auth/]
  ↓
User fills form (email + password + rememberMe)
  ↓
react-hook-form validates via zodResolver(loginSchema)   [src/schema/auth/auth.ts]
  → validation errors shown inline if invalid (i18n keys from useTranslations("auth"))
  ↓
onSubmit -> handleAuthSubmit("login", values) -> loginAction(payload)   [src/actions/auth/auth.ts]  "use server"
  ↓
loginService(payload)   [src/api/callers/auth/auth-factory.ts (+ auth-browser.ts)]
  → apiPost(API_PUBLIC_ROUTES.auth.login, payload)
  → returns { data: ApiResponse<LoginResponse>, cookies: Set-Cookie parsed }
  ↓
Server Action reads response:
  - data.code === ApiErrorCode.Success?   [ApiErrorCode from src/constants/api-error-code.ts]
    YES → set 3 cookies on browser via next/headers cookies().set():
            access_token   (HttpOnly — browser sends via credentials:include; BE reads cookie)
            refresh_token  (HttpOnly, maxAge from BE Set-Cookie)
            session_id     (HttpOnly, same maxAge)
            auth_session_expires_at (HttpOnly FE-only — absolute expiry for refresh fallback)
          → return { success: true, message, code }
    NO  → return { success: false, message, code }
  ↓
Client receives AuthActionResult:
  - success=true  → mutateMe() [invalidate SWR cache] → useAuthStore.closeAllModals()
                    → redirect to nextLink if set
  - success=false → translateApiErrorCode(tErrors, result.code) inline or toast — never result.message
```

---

## 1b. Social OAuth Login Flow (Discord + Google on popup)

> **Popup:** `AuthSocialLogin` wires **Discord + Google** only. X actions/hooks remain but are not connected to the modal.

```
User clicks Discord or Google on LoginContent / SignupContent
  ↓
useDiscordLogin | useGoogleLogin
  ↓
Discord: startDiscordLoginAction → window.open(authorizeUrl)
         popup /auth/discord/callback → postMessage(code, state)
         → discordLoginAction → discordLoginService → POST /api/v1/auth/discord
Google:  GSI code client popup → googleLoginAction → POST /api/v1/auth/google
  ↓
finalizeAuthLoginAction (shared with email login)
  → set session cookies on success
  ↓
useOAuthPostAuth onSuccess:
  mutateMe() + closeAllModals() + router.push(nextLink) when set
  ↓
Errors: translateApiErrorCode (BE 4013–4017/4019, 4023–4025; FE-local 4018, 4020–4022, 4026)
```

---

## 2. Token Refresh Flow (Transparent)

Owned by `src/api/transport/api-transport.ts` + adapters (`browser-auth` / `server-auth`). Non-2xx HTTP outcomes throw `ApiHttpError`. Timeout / network / **abort** / parse / policy errors thrown from `fetch-core` pass through `reportApiError` before rethrow. **Expected** = `ApiRefreshRequiredError` only. Guest `GET /me` 401 and `ERR_BLOCKED_BY_CLIENT` **are logged**. **Logged** set includes all 4xx, 5xx, abort, network, parse, timeout, policy, replay. Console `[API]` when **`isServer()` OR `NODE_ENV === "development"`**; production browser silent + Zustand. BFF refresh maps `ApiTimeoutError` → 504.

```
Any authenticated request fails
  ↓
HTTP non-2xx → FailedHttpResponse descriptor
  OR transport throw (timeout/network/abort/parse/policy) → reportApiError (filter) → rethrow
  ↓
Refresh eligibility (401/403 + X-Token-Expired or 401 without Bearer; not already retried)
  If not eligible → reportApiError(ApiHttpError, filter) → throw
  ↓
  browser-proxy:
    rawPost absolute same-origin URL: `${window.location.origin}/api/auth/refresh`
    (relative `/api/auth/refresh` alone is invalid for fetch-core URL parse)
    single-flight module Promise; waiters share one result
  server-writable:
    rawPost BE refresh with X-Refresh-Token + X-Session-Id; persist cookies
  server-readonly / no-context:
    throw ApiRefreshRequiredError (expected — no reporter console/store)
  ↓
  Refresh succeeds? → retry once with rotated Bearer
  Refresh fails? → throw original protected ApiHttpError with sanitized refresh cause
    (guest `GET /me` 401 and other 4xx still reported)
```

**Important notes:**
- Browser refresh uses an absolute origin URL so `fetch-core` does not throw `invalid-url` before the network call.
- On refresh failure, `result.cause` / server catch cause is sanitized and attached to the original protected-request error.
- `rawPost` (not authenticated `apiPost`) is used for refresh to avoid recursion.
- FE refresh Route Handler exact-validates upstream `{code,message,data}` (finite integer code, non-empty string message) before cookie persist; malformed upstream → safe `502` (never invent success `0`/`"OK"`). Client success DTO remains access_token-only; browser adapter exact-validates top-level keys `{code,message,data}` with `data.access_token` only. Error responses use fixed safe messages and allowlisted `code` values only (never raw BE message passthrough).

---

## 3. Current User (Me) Fetch Flow

```
App boots → AppProviders renders
  ↓
SWRConfig wraps the tree   [src/components/providers/app-providers.tsx]
  ↓
MeSwrSync component mounts → useSyncMeFromAuth()   [src/hooks/auth/use-auth-store.ts]
  ↓
useAuth() runs   [src/api/hooks/auth/useAuth.ts]
  → useSWR(getMeEndpointKey, getMeService, { revalidateOnFocus: true, shouldRetryOnError: false })
  ↓
getMeService()   [src/api/callers/auth/auth-factory.ts (+ auth-browser.ts)]
  → apiFetch(getMeEndpointKey)
  → GET /api/v1/me with access_token cookie attached by browser credentials:include
  ↓
  401 response? → return null (user not logged in — no error thrown)
  Other error?  → throw (network error, 5xx)
  200 response? → return MeResponse
  ↓
useAuth exposes errorCode for non-401 GET failures:
  → extractApiError(error)?.code → consumers can translate via errors.codes.*
  ↓
useSyncMeFromAuth:
  useEffect([me, isLoading, error, mutate]) → useMeStore.syncFromUseAuth({ me, isLoading, error, mePermissions, mutate })
  ↓
All components read via useGetMe():
  → useMeStore(useShallow(...)) → { me, isLoading, isError, mePermissions, mutateMe }

Me mutation callers (ready for account-settings UI):
  patchMeService / deleteMeService / hardDeleteMeService / getMyPermissionsService
  → API errors via toastApiError(tErrors, error) at call site
```

**SWR revalidation triggers:**
- Window focus — **`useAuth` only** (`revalidateOnFocus: true` in `useAuth.ts`). Global `SWRConfig` sets `revalidateOnFocus: false` for all other hooks unless a hook opts in.
- `mutateMe()` called explicitly after login/logout

**SWR error retry (global):** `AppProviders` sets `errorRetryInterval: 180_000ms` (3 min). Hooks with `shouldRetryOnError: false` (e.g. `useAuth`, `useMyInstructorApplication`) do not auto-retry. Other hooks inherit the 3-minute interval instead of SWR’s default 5-second retry.

**Become-instructor:** `useMyInstructorApplication` does not revalidate on focus and returns bootstrap-only `isLoading` so `BecomeInstructorPage` keeps the form mounted when the user returns to the tab.

---

## 4. Form Submission Pattern

Standard pattern for all forms (login, signup, future forms):

```
1. Define Zod schema in src/schema/<domain>/<form>.ts
   → validation message = i18n key (NOT hardcoded string)
   → export inferred type: export type XFormValues = z.infer<typeof xSchema>

2. useForm<XFormValues>({ resolver: zodResolver(xSchema) })
   → register / Controller for each field
   → formState.errors for inline error display (translate key via useTranslations())

3. handleSubmit(onSubmit) → onSubmit receives validated data

4. onSubmit calls a Server Action (not a direct API call from client):
   const result = await xAction(data)

5. Handle result:
   - result.success → update UI, mutate SWR if needed, navigate or close modal
   - !result.success → `translateApiErrorCode(useTranslations("errors.codes"), result.code)` (never `result.message`)
```

---

## 5. Auth Modal State Flow

```
openLoginModal(nextPath?)  → authAction="login",  nextLink=nextPath
openSignupModal(nextPath?) → authAction="signup", nextLink=nextPath
closeAllModals()           → authAction="none",   nextLink=null

LoginSignupPopup (mounted in header.tsx, outside AuthLayout):
  authAction === "login"  → show LoginContent
  authAction === "signup" → show SignupContent
  authAction === "none"   → dialog closed

LoginContent ↔ SignupContent:
  → Switch tab → setAuthAction("signup") / setAuthAction("login")
```

---

## 6. Authorization / Permission Check Pattern

```
Source: GET /api/v1/me → MeResponse.permissions → useSyncMeFromAuth → useGetMe().mePermissions (string[])

Constants: PERMISSIONS, PERMISSION_IDS, ROLES, HEADER_DROPDOWN_ITEMS (+ per-item permissions / titleKey)  [src/constants/]
Types: PermissionName, PermissionRequirement, PermissionCheckMode  [src/types/permissions/]
Utils: PERMISSION_NAME_TO_ID, permissionIdFromName  [src/lib/utils/permission.ts]
Utils: hasPermission, hasAllPermissions (AND), hasAnyPermission (OR), satisfiesPermissions, filterPermissionNavTree, filterUserMenuItems, filterUserMenuGroups  [src/lib/utils/permission.ts]
Hooks: useHasPermission, useHasAll/AnyPermissions, useSatisfiesPermissions, useFilteredUserMenuGroups  [src/hooks/auth/use-permissions.ts]
Component: PermissionGate  [src/components/shared/permission-gate.tsx]

Config rule (menu + PermissionRequirement):
  permissions undefined or [] → visible (when authenticated)
  permissionMode omitted → "all" (AND, mirrors BE RequirePermission)
  permissionMode "any" → OR guard
  current temporary state: HEADER_DROPDOWN_ACCOUNT_GROUPS_PENDING not spread into HEADER_DROPDOWN_ITEMS (route constants kept); role-switch links still require role-modify permissions
  current i18n state: all header dropdown items provide both `title` and `titleKey`

User menu filter flow:
  HEADER_DROPDOWN_ITEMS (constants/common.ts; UserMenuGroup types in types/user-menu.ts)
    → useFilteredUserMenuGroups() → filterUserMenuGroups(mePermissions set)
    → filterUserMenuItems / filterPermissionNavTree: recurse all nested children first
    → leaf with href: requires satisfiesPermissions on that item
    → branch without href: kept when any permitted descendant remains
    → empty groups dropped
    → UserMenuDropdownItems renders visible groups (recursive nested links); separators only between visible groups

Dashboard nav filter flow:
  ADMIN_DASHBOARD_ITEMS | INSTRUCTOR_* | SYSADMIN_* (constants/dashboard/)
    → useFilteredDashboardItems() → filterDashboardItems → filterPermissionNavTree
    → same bottom-up rules as user menu (all depths)
    → DashboardSidebar renders filtered tree recursively

Example (single permission):
  import { PERMISSIONS } from "@/constants/permissions";
  import { useHasPermission } from "@/hooks/auth";

  const canCreateCourse = useHasPermission(PERMISSIONS.CourseCreate);
  if (!canCreateCourse) return null;

Example (config-driven — menu item or PermissionGate):
  <PermissionGate permissions={[PERMISSIONS.UserRead, PERMISSIONS.UserUpdate]} permissionMode="all">
    <UserAdminPanel />
  </PermissionGate>

If user is not logged in: mePermissions = [] → all checks return false.
Re-login required after BE permission matrix changes (JWT cache).
```

---

## 7. i18n Text Resolution Flow

```
next-intl middleware (src/proxy.ts)
  → skipped for locale-less OAuth callbacks (/auth/discord/callback, /auth/x/callback)
  → otherwise detects locale from URL prefix (/vi/... or /en/...)
  → sets locale cookie / header

Server Component or Client Component:
  → useTranslations("namespace") or getTranslations("namespace")
  → returns typed translation function t("key")

Message files: src/messages/vi.ts, src/messages/en.ts (loaded via src/lib/i18n/load-messages.ts)

Convention:
  → Zod validation messages = i18n key strings (e.g. "validation.email", "validation.title")
  → Resolve via resolveValidationMessage / resolveAuthValidationMessage — skip t() when message is undefined
  → API errors = errors.codes.{numericCode} only (src/messages/error-codes.ts)
  → Form validation = module.validation.* namespaces (separate from API codes)
```

---

## 8. API Error Display Flow (user-facing)

```
API call fails (transport throws or Server Action returns !success)
  ↓
extractApiError(error) or result.code from AuthActionResult
  → { code, message }   // message kept for mappers only — never Console / never UI
  ↓
translateApiErrorCode(tErrors, code)  OR  toastApiError(tErrors, error)
  → tErrors = useTranslations("errors.codes")
  → key = String(code); unknown → fallback 9999
  → toastApiError: toast + optional development `console.debug({ code })` (never BE message)
  ↓
Toast or inline <p> — user never sees BE message string
```

Modules migrated: Auth, Me GET errorCode, Media, Taxonomy, Instructor, Course (incl. useCourseEditorState).

---

## 9. API Error Global Capture Flow

```
Any apiTransport request fails (error response) on client
  ↓
Fetch transport reporter in src/api/transport/api-transport.ts
  -> useApiError.getState().push({ statusCode, appCode, message, url, method })
  ↓
Error is re-thrown so callers can still catch it locally.

Components can subscribe to the global error store:
  const { lastError, errors, clear } = useApiError()
  → show toast / banner / error overlay based on lastError
```

---

## 10. Course Editor — Basic Info Save (Optimistic Lock)

**Source:** `src/hooks/course/use-course-editor-state.ts`, `src/lib/utils/course.ts`, `updateCourseBasicInfoService`

```
User clicks Save on info tab
  ↓
handleSaveBasicInfo()
  ├─ courseBasicInfoSchema.safeParse(basicInfo)  → fail? toastValidationError
  ├─ PATCH /courses/:id/basic-info  { …fields, expected_row_version }
  ├─ success: setBasicInfo.expected_row_version ← response draft_version.row_version
  ├─ mutateDetail(response, { revalidate: false })  → SWR cache row_version in sync
  └─ toast "basicInfoSaved"

useCourseBasicInfoState(activeVersion)
  ├─ draft version id changed  → reset full form from server
  └─ same id, row_version changed  → update expected_row_version only (external refresh / cache)
```

BE increments `row_version` on each PATCH; stale `expected_row_version` returns `409` / app code `3005`.

---

## 11. Course Editor — Submit-for-Review Validation Flow

**Source:** `src/lib/utils/course.ts`, `src/hooks/course/use-course-editor-state.ts`, `src/screen/instructor/courses/editor-page.tsx`

**Visibility:** Submit / prepare / reopen header buttons render only when `courseDetail.collaborator_role === "OWNER"` (`canManageReviewWorkflow`). Collaborators (`EDITOR`) may still edit basic info and outline when `draft_version.status === "DRAFT"`.

```
Owner clicks "Submit for Review"  (button hidden for EDITOR)
  ↓
AlertDialog confirmation  [editor-page.tsx — ConfirmActionDialog + course.editor.submitConfirm]
  → Cancel → no API call
  → Confirm
  ↓
handleSubmitReview()  [use-course-editor-state.ts]  → returns boolean
  ↓
validateCourseSubmitReadiness(courseDetail)  [src/lib/utils/course.ts]
  ├─ draftVersion present?     NO  → ZodIssue(submitBasicInfoIncomplete)
  ├─ courseBasicInfoSchema.safeParse(basicInfoState)  → fail? ZodIssue(submitBasicInfoIncomplete)
  ├─ collaborators.length >= 1  NO → ZodIssue(submitCollaboratorRequired)
  ├─ outline.length >= 1         NO → ZodIssue(submitOutlineNoSections)
  ├─ each section.lessons >= 1   NO → ZodIssue(submitOutlineNoLessons)
  ├─ each lesson.sub_lessons >= 1 NO → ZodIssue(submitOutlineNoItems)
  └─ for each subLesson: validateSubLessonReadiness(subLesson)
       ├─ VIDEO → media_file_id empty?     → "submitInvalidSubLesson"
       ├─ TEXT  → countDeltaNonWhitespace < 1? → "textContentRequired"
       └─ QUIZ  → is_preview == true?         → "quizPreviewNotAllowed"
               → prompt empty or no options?  → "submitInvalidSubLesson"
               → any option body empty?       → "submitInvalidSubLesson"
               → no correct answer?           → "quizCorrectAnswerRequired"
               → allow_multiple == false and >1 correct? → "quizSingleChoiceMultipleCorrect"
  ↓
issues !== null?
  → show toast/error using tValidation("course.validation.<key>")
  → abort (no API call)
  ↓
issues === null?
  → submitReviewService(courseId)  POST /api/v1/courses/:courseId/submit-review
  → BE requireOwnerAccess (EDITOR without button still gets 403 if called directly)
  → return true; dialog closes
  → refreshDetail() best-effort; on failure toast course.editor.toast.refreshAfterSubmitFailed (submit already succeeded)
```

### Sub-lesson content validation on save (`saveSubLesson`)

Before calling the save API, `saveSubLesson` calls `validateSubLessonFormContent` (same rules as `validateSubLessonReadiness` but operates on raw form state, including `allow_multiple`). QUIZ branch delegates to `courseQuizOptionSchema.safeParse` and maps Zod issues via `firstValidationMessageKey` → `course.validation.*`. Then `validateSubLessonDurationForm` checks TEXT/QUIZ H/M/S fields (`0`–`999h` in ms via `buildSubLessonEstimatedDurationPayload`); failure toasts `course.validation.subLessonDurationInvalid`. Additionally, `is_preview` is forced to `false` for `QUIZ` sub-lessons before the payload is sent.

Payload duration (TEXT/QUIZ only):

```ts
const estimatedDurationMs = buildSubLessonEstimatedDurationPayload(subLessonForm);
// omitted for VIDEO — BE resolves from media_files.duration on read
```

Quiz editor UI (`SubLessonQuizFields` in `course-editor-dialogs.tsx`):

- Single-choice (`allow_multiple = false`): checking one correct answer clears all others; unchecking only affects that option.
- Switching from multiple-choice to single-choice sets the first option as the only correct answer.

```ts
const isPreview = subLessonForm.kind === "QUIZ" ? false : subLessonForm.is_preview;
```

### i18n keys (`course.validation.*`)

| Key | Meaning |
|-----|---------|
| `videoMediaRequired` | VIDEO sub-lesson missing media file |
| `textContentRequired` | TEXT sub-lesson empty content |
| `quizPreviewNotAllowed` | QUIZ sub-lesson marked as preview (not allowed) |
| `quizCorrectAnswerRequired` | QUIZ has no correct answer |
| `quizSingleChoiceMultipleCorrect` | Single-choice QUIZ has more than one correct answer |
| `subLessonDurationInvalid` | TEXT/QUIZ estimated duration outside `0`–`999h` |
| `submitInvalidSubLesson` | Sub-lesson invalid (catch-all) |
| `submitBasicInfoIncomplete` | Draft basic info incomplete |
| `submitCollaboratorRequired` | No collaborator on course |
| `submitOutlineNoSections` | Outline has no sections |
| `submitOutlineNoLessons` | A section has no lessons |
| `submitOutlineNoItems` | A lesson has no sub-lessons |

---

## 12. Stream Event Ingest Flow

```
EventsStreamProvider mounts (client)
  ↓
startStreamEventTransports()
  ├─ broadcast: ensureBroadcastChannel + onmessage
  ├─ sse: fetchEventSource(url) if NEXT_PUBLIC_STREAM_SSE_URL set
  ├─ websocket: ReconnectingWebSocket if NEXT_PUBLIC_STREAM_WS_URL set
  └─ gRPC: fetch NDJSON GET if NEXT_PUBLIC_STREAM_GRPC_BASE_URL set
  ↓
Transport receives raw message
  ↓
publishRawStreamPayload(raw, defaultSource?)
  ↓
normalizeInboundEnvelope(raw, { defaultSource, nextSeq })
  ├─ inboundSchema (source?, type, payload, metadata?)
  ├─ buildMetadata → timestamp, seq, code (makeStreamEventCode)
  └─ buildTypedStreamEvent → Zod payload per inboundPayloadBySource[source][type]
  ↓
If null → stop (invalid / unknown type)
  ↓
useStreamEventsStore.push(event)
  ↓
emitStreamEventToSubscribers(event)
  ↓
useStreamEvent / useWebSocketStreamEvent / … filters by source/type → handler
  (handler kept fresh via useEffect + ref inside useStreamEvent only)

WebSocket-only branch after publish:
  if event.type === "ping" → postSocketOutbound({ type: "pong", payload: { id } })
```

Allowed inbound types by source (see `src/events/core/normalize-inbound.ts`):

| source | types |
|--------|--------|
| `broadcast` | `logout`, `confirm_success` |
| `sse` | `notification`, `hello`, `pong` |
| `websocket` | `notification`, `hello`, `ping`, `pong` |
| `gRPC` | `notification`, `hello` |

---

## 13. Course version numbering (editor)

```
Instructor opens /instructor/courses/:courseId/*
  ↓
useCourseDetail(courseId)
  → GET /api/v1/courses/:id (full detail, once per courseId — SWR cache across editor tabs)
  → CourseDetail { live_version?, draft_version?, last_rejection_reason? }
  ↓
Info tab: useTaxonomyList ×5 with include_images=false (parallel, SWR dedupe 5m)
  ↓
editable = draft_version?.status === "DRAFT"
canManageReviewWorkflow = collaborator_role === "OWNER"
  ↓
Header badges:
  - versionBadge → draft_version.version_no (or live when no draft)
  - publishedVersionBadge → live_version.version_no when both draft and live exist
  - collaboratorRole badge → OWNER / EDITOR ("Cộng tác viên" / "Collaborator")
  ↓
Header actions (owner-only):
  - no draft + live → Prepare draft  (POST …/draft/prepare)
  - DRAFT → Submit for review
  - legacy REJECTED pointer → Reopen draft
  ↓
Submit for review (DRAFT only, OWNER only):
  POST /api/v1/courses/:courseId/submit-review
  → same version_no; status IN_REVIEW; tabs read-only until decision
  ↓
Admin reject:
  POST /api/v1/course-reviews/:courseId/reject
  → submitted row REJECTED (history); new DRAFT at max(version_no)+1
  → FE shows last_rejection_reason on new draft; editable again
  ↓
Admin approve:
  POST /api/v1/course-reviews/:courseId/approve
  → submitted row becomes live_version; draft pointer cleared
  → Prepare draft → next version max+1 cloned from published
```

Legacy data: if `current_draft_version_id` still points to `REJECTED`, **Reopen draft** calls `POST …/reopen-draft` to fork `max+1` (same as reject fork).

---

## 14. Dropdown menu → dialog (catalog, review queue, course outline)

```
Row action menu (admin catalog | review queue | instructor outline)
  ↓
DropdownMenu modal={false}
  → CourseAdminTableActionsMenu (admin/sysadmin lists)
  → CourseOutlineRowActions (instructor outline tab)
  ↓
User selects an action that opens Dialog / AlertDialog or runs post-menu work
  → DeferredDropdownMenuItem.onAction
  → deferDropdownAction(callback)   // setTimeout(0) — menu unmounts first
  ↓
Examples:
  CourseReviewPage — Approve/Reject Dialog → POST course-reviews approve/reject
  CourseAdminAllPage — ConfirmDeleteDialog → trashCourseService
  CourseAdminTrashPage — ConfirmDeleteDialog or restore API
  Instructor outline — openSectionDialog / openLessonDialog / openSubLessonDialog
  ↓
Dialog closes → document.body.pointerEvents stays "auto" (page + sidebar clickable)
```

**Regression fixed (2026-06-26):** modal `DropdownMenu` + immediate `Dialog` left `body { pointer-events: none }`. Shared fix: `deferDropdownAction` + `DeferredDropdownMenuItem` + `modal={false}` on row-action menus.
