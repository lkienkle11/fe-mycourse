# Logic Flow

_Last audited: 2026-06-12 (quiz single-choice validation + editor UI, course editor submit validation, quiz preview enforcement)._


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
loginService(payload)   [src/api/callers/auth/auth.ts]
  → apiPost(API_PUBLIC_ROUTES.auth.login, payload)
  → returns { data: ApiResponse<LoginResponse>, cookies: Set-Cookie parsed }
  ↓
Server Action reads response:
  - data.code === ApiErrorCode.Success?   [ApiErrorCode from src/constants/api-error-code.ts]
    YES → set 3 cookies on browser via next/headers cookies().set():
            access_token   (HttpOnly — browser sends via withCredentials; BE reads cookie)
            refresh_token  (HttpOnly, maxAge=30d if rememberMe)
            session_id     (HttpOnly, same maxAge as refresh_token)
          → return { success: true, message, code }
    NO  → return { success: false, message, code }
  ↓
Client receives AuthActionResult:
  - success=true  → mutateMe() [invalidate SWR cache] → useAuthStore.closeAllModals()
                    → redirect to nextLink if set
  - success=false → translateApiErrorCode(tErrors, result.code) inline or toast — never result.message
```

---

## 2. Token Refresh Flow (Transparent, client-side)

Handled automatically in `src/api/instance.ts` response interceptor.

```
Any apiInstance request fails with 401 or 403
  ↓
Interceptor checks refresh conditions:
  - X-Token-Expired: "true", OR
  - 401 with missing/empty Authorization bearer while refresh cookies exist
  If neither condition matches -> re-throw error
  ↓
  PRESENT →
    isRefreshing === true?  → queue request into pendingResolvers (mutex prevents stampede)
    isRefreshing === false? →
      isRefreshing = true
      ↓
      rawPost(API_PUBLIC_ROUTES.auth.refresh, null, headers: {
        X-Refresh-Token: refresh_token cookie,
        X-Session-Id:    session_id cookie
      })
      ↓
      Refresh succeeds?
        YES → new access_token, refresh_token received
              → setCookieValue("access_token", newToken)
              → setCookieValue("refresh_token", newRefreshToken)
              → flushRefreshQueue(newAccessToken) → retry all queued requests
              → retry original failed request with new token
        NO  → flushRefreshQueue(null) → reject all queued requests
              
```

**Important notes:**
- Refresh mutex uses module-level `isRefreshing` + `pendingResolvers` array — prevents N parallel requests all triggering N refresh calls.
- On server (SSR/Server Component), each request is isolated — no shared module state between different users.
- `rawPost` (not `apiInstance.post`) is used for the refresh call to avoid interceptor recursion.

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
getMeService()   [src/api/callers/auth/auth.ts]
  → apiFetch(getMeEndpointKey)
  → GET /api/v1/me with access_token cookie attached by interceptor
  ↓
  401 response? → return null (user not logged in — no error thrown)
  Other error?  → throw (network error, 5xx)
  200 response? → return MeResponse
  ↓
useAuth exposes errorCode for non-401 GET failures:
  → extractAxiosApiError(error)?.code → consumers can translate via errors.codes.*
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
- Window focus (automatic)
- `mutateMe()` called explicitly after login/logout

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
  current temporary state: legacy study/account links use commented config guards; role-switch links still require role-modify permissions
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
  → detects locale from URL prefix (/vi/... or /en/...)
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
API call fails (Axios throws or Server Action returns !success)
  ↓
extractAxiosApiError(error) or result.code from AuthActionResult
  → { code, message }   // message = dev reference only (console.debug in development)
  ↓
translateApiErrorCode(tErrors, code)  OR  toastApiError(tErrors, error)
  → tErrors = useTranslations("errors.codes")
  → key = String(code); unknown → fallback 9999
  ↓
Toast or inline <p> — user never sees BE message string
```

Modules migrated: Auth, Me GET errorCode, Media, Taxonomy, Instructor, Course (incl. useCourseEditorState).

---

## 9. API Error Global Capture Flow

```
Any apiInstance request fails (error response) on client
  ↓
Axios response interceptor in src/api/instance.ts
  -> useApiError.getState().push({ statusCode, appCode, message, url, method })
  ↓
Error is re-thrown so callers can still catch it locally.

Components can subscribe to the global error store:
  const { lastError, errors, clear } = useApiError()
  → show toast / banner / error overlay based on lastError
```

---

## 10. Course Editor — Submit-for-Review Validation Flow

**Source:** `src/lib/utils/course.ts`, `src/hooks/course/use-course-editor-state.ts`

```
Instructor clicks "Submit for Review"
  ↓
handleSubmitReview()  [use-course-editor-state.ts]
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

## 11. Stream Event Ingest Flow

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
