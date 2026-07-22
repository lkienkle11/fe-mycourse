# API Overview (`fe-mycourse`)

_Last audited: 2026-07-22 (browser `[API]` Console only when NODE_ENV=development; server sanitized logs; prod browser silent)._

## Scope
Frontend API layer lives in `src/api/` and is used by `src/actions/` and client hooks.

## Layout
Transport code is grouped by folder (SoT owners stay as separate files inside folders):

| Folder | Role |
|--------|------|
| `src/api/core/` | Fetch executor, body/helpers/errors, `methods`, `raw-http` |
| `src/api/transport/` | Authenticated `ApiTransport` + browser `ApiMethods` binding |
| `src/api/auth/` | Refresh eligibility/envelopes + browser/server runtime adapters |
| `src/api/server/` | `cache-policy` + `serverRawFetch` (server-only) |
| `src/api/callers/` | Per domain: `*-factory.ts` (isomorphic) + `*-browser.ts` (Zustand-bound) |
| `src/api/hooks/` | SWR hooks |

## Layers (paths)
- `transport/api-transport.ts`: ApiTransport + injectable reporter (browser installs Zustand; server never imports Zustand). **Every authenticated request** hard-codes `cache: "no-store"` (browser and server). Default authenticated timeout is **10s** (`fetch-core` when unset); per-request override via `FetchApiOptions` / `MutationApiOptions`.`timeout` (ms). Optional mutation `compress?: boolean` (default false) — gzip JSON POST/PUT/PATCH only; body memo shared across refresh retry so gzip runs once; no callers enable it yet. Only browser **raw GET** may omit cache; only `serverRawFetch` may use endpoint-bound Next Data Cache.
- `auth/auth-refresh.ts`: refresh eligibility + `validateRotatedTokens` + exact success-envelope helpers.
- `core/fetch-core.ts` + `fetch-core-redirect.ts`: native Fetch executor; timeout/abort through body-read; overall redirect deadline; Cookie merge generated→caller.
  - **`executeFetchCoreOutcome`** orchestrates only: `prepareFetchCoreRequest` → `dispatchFetchResponse` → `readResponseData` → `toFetchCoreOutcome` (helpers stay file-private; export signature unchanged).
  - **`followServerRedirects`**: hop execute + `resolveRedirectTargetUrl` + `applyRedirectHopState`; **await** intermediate body `cancel()` before the next hop or policy throw (301/302/303/307/308 only).
  - Fetch redirect TypeError classification lives only in **`classifyFetchFailure`** (not a dead branch after `executeOnce`).
- `core/fetch-core-body.ts`: replayable bodies; server strings → UTF-8 bytes. Optional **`compress`** (default false) for JSON POST/PUT/PATCH: gzip **once** via `CompressionStream("gzip")` into a replayable `ArrayBuffer` shared for refresh retry + redirect hops (transport `bodyMemo`); keep `Content-Type: application/json`, set `Content-Encoding: gzip`, do **not** set `Content-Length`. After caller header merge, fetch-core **forces** `Content-Encoding: gzip` and strips `Content-Length` when the body is gzipped. Gzip runs **after** abort/timeout lifecycle starts and honors the request signal. FormData / uploads / GET / DELETE / OPTIONS are never compressed. No caller enables `compress: true` yet (BE does not decompress gzip).
- `core/fetch-error.ts`: transport errors + `parseApiErrorEnvelope` + `throwApiPolicyError`.
- `core/methods.ts` / `core/raw-http.ts`: typed `api*` / `raw*` helpers. **Public `RawApiOptions`** includes `headers`, `cookies`, `params`, `timeout`, `withCredentials`, `baseURL`, `signal`, and optional **`cache?: RequestCache` (honored only for raw GET)**. No public `redirect` / `trustedOrigin` (credential refresh uses `rawPostRefreshUpstream`).
  - **Default when `cache` omitted (unchanged):** browser GET → omit Fetch cache (browser HTTP semantics); server GET → `no-store`; POST/PUT/PATCH/DELETE/OPTIONS → always `no-store` (caller `cache` ignored).
  - **Opt-in:** `rawFetch(url, { cache: "force-cache" })` (GET only). This is Fetch RequestCache opt-in — **not** a 30s TTL. Exact TTL still needs `Cache-Control: max-age=…`, Cache Storage timestamps, or Next `revalidate` via `serverRawFetch` profiles.
- `auth/refresh-upstream-raw.ts`: **`rawPostRefreshUpstream`** — credential refresh POST only; hard-codes `redirect: "error"` + `resolveTrustedOrigin(baseURL)` so `X-Refresh-Token` / `X-Session-Id` never follow cross-origin redirects. Used by BFF + `refreshUpstreamSession`.
- `server/cache-policy.ts` + `server/server-raw-http.ts`: public cache profiles + cached GET.
  - **`serverRawFetch`** = `assertServerRawFetchOptions` + `resolveServerRawCacheOptions` + `executeFetchCore` (no auth cookies/signal/credentials).
- `auth/auth-runtime.ts` + `browser-auth.ts` / `server-auth.ts`: adapters; exact browser refresh DTO.
- Domain callers: **`create*Callers` lives in `*-factory.ts`** (no `browserApiMethods` / Zustand). Browser singletons live in `*-browser.ts`. **Server Actions must import the factory path** (e.g. `@/api/callers/auth/auth-factory`), never a module that evaluates browser bindings. BFF `src/app/api/auth/refresh/route.ts` exact-validates upstream envelope.

## Contracts
- Response envelope: `ApiResponse<T>` in `src/types/api.ts`.
- Low-level helper return type: `ApiResult<T>` with `data/statusCode/headers/cookies`.
- Error code map: `ApiErrorCode` in `src/constants/api-error-code.ts` (1:1 with BE `errcode_codes.go`, including `R2BucketNotConfigured = 9019`).
- Server authenticated redirects follow only 301/302/303/307/308 (304 and other 3xx are not Location hops).
- Success type guard: `isApiSuccess()` in `src/lib/utils/api.ts`.
- User-facing errors: `toastApiError` / `translateApiErrorCode` in `src/lib/utils/api-error.ts` → `errors.codes.{code}`.

## Auth routes used
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register` — register / resend confirmation (`registerAction`, `registerService`); body includes `locale` (`en`|`vi`) from current UI locale
- `POST /api/v1/auth/confirm` — confirm email and issue tokens (`confirmAction`, `confirmService`)
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

## Me routes (private)

`API_PRIVATE_ROUTES.user` in `src/constants/api-route.ts`:

| Route | Caller | Notes |
|-------|--------|-------|
| `GET /api/v1/me` | `getMeService` | 401 → `null` (anonymous) |
| `PATCH /api/v1/me` | `patchMeService` | Body: `{ avatar_file_id?: uuid }` |
| `DELETE /api/v1/me` | `deleteMeService` | Soft-delete account |
| `DELETE /api/v1/me/hard` | `hardDeleteMeService` | Hard-delete |
| `GET /api/v1/me/permissions` | `getMyPermissionsService` | Permission name strings |

`useAuth` exposes `errorCode` for non-401 GET failures.

## Instructor routes (private)

Mounted under `API_PRIVATE_ROUTES.instructor` — see `instructor-factory.ts` (composes roster/application/profile/expertise/ticket slices) + `instructor-browser.ts` and `docs/instructor-admin.md`:

- `GET/DELETE /api/v1/instructors` (roster list/remove); `POST /api/v1/instructors/bulk` (add)
- `GET/POST /api/v1/instructor-applications`, approve/reject, delete — detail chip hydration threads **`locale`** from query through service → repository; FE detail callers include `locale` in URL/SWR key
- `GET/PUT /api/v1/instructor-applications/me` (+ first POST submit) — become-instructor: FE `useMyInstructorApplication` includes **`locale`** in SWR key/fetcher; submit/resubmit pass **`locale`** so mutation responses hydrate chips correctly under `revalidate: false`
- `GET/POST/PATCH/DELETE /api/v1/instructor-profiles`, `GET …/me` — identity/snapshot DTOs (no separate named taxonomy chip hydrate on profile GETs)
- `GET/POST/DELETE …/instructors/:id/expertise/topics|skills` — pass **`locale`**; FE SWR keys must include `locale`
- `GET/POST /api/v1/instructor-tickets`, messages, `POST …/close`

## Course routes (private)

Mounted under `API_PRIVATE_ROUTES.course` — see `src/api/callers/course/course-factory.ts (+ course-browser.ts)`, `src/api/hooks/course/useCourses.ts`, and `docs/instructor-admin.md`:

| Route | Caller / hook | Notes |
|-------|---------------|-------|
| `GET /api/v1/courses/my` | `listMyCoursesService` / `useMyCourses` | Instructor editable course list |
| `POST /api/v1/courses` | `createCourseService` | Body `{ title }` only |
| `GET /api/v1/courses/:courseId` | `getCourseDetailService` / `useCourseDetail` | Optional `include_outline=false` on info/collaborators tabs |
| `PATCH /api/v1/courses/:courseId/basic-info` | `updateCourseBasicInfoService` | Optimistic lock via `expected_row_version`; FE updates lock from PATCH response + SWR cache (`handleSaveBasicInfo` / `useCourseBasicInfoState`) so back-to-back saves stay in sync |
| `DELETE /api/v1/courses/:courseId` | `deleteCourseService` | Owner-only |
| Collaborator list / picker | `listCourseCollaboratorsService`, `listCourseInstructorCandidatesService`, `useCourseCollaborators`, `useCourseInstructorCandidates` | Paginated `GET …/collaborators` (`course_instructor:read`) + picker `GET …/instructor-candidates` (**P67** `course_collaborator_candidate:read`; owner-only in repo) |
| Collaborator CRUD | `*Collaborator*Service` | Under `/courses/:courseId/collaborators` |
| Outline CRUD / reorder | `*Section*`, `*Lesson*`, `*SubLesson*` services | Outline tab only (`includeOutline: true`) |
| Lease acquire/heartbeat/release | `*Lease*Service` | Edit coordination |
| `POST …/draft/prepare` | `prepareCourseDraftService` | Fork next DRAFT from published (**owner-only** BE + hidden for EDITOR in UI) |
| `POST …/submit-review` | `submitCourseReviewService` | Draft → `IN_REVIEW` (**owner-only**) |
| `POST …/reopen-draft` | `reopenCourseDraftService` | Legacy fork from rejected version (**owner-only**) |

**Read-path performance (instructor editor):**

- `useCourseDetail(courseId)` — full detail once per courseId; SWR cache reused when switching tabs (no refetch).
- Info tab only: `useTaxonomyList` with `include_images: false`.

See `docs/api-using.md` § Course detail and § Taxonomy.

## Taxonomy routes (private)

`API_PRIVATE_ROUTES.taxonomy` — callers in `src/api/callers/taxonomy/taxonomy-factory.ts (+ taxonomy-browser.ts)`, hooks in `src/api/hooks/taxonomy/useTaxonomy.ts` (`useTaxonomyList`, detail via `getTaxonomyDetailService`).

List query extends `ApiListQueryParams` with `search_by`, `search_value`, **`locale`** (content locale for resolved labels; from `useLocale()`), and optional `include_images` (`false` skips image URL hydration — course editor pickers only; admin CRUD screens keep default `true`).

**Dual response:** list / `GET /:id?locale=` → localized/public shape; `GET /:id?view=edit` → admin editable (canonical + full `translations` + `row_version`). PATCH sends `expected_row_version` (stale → 409 / **3005**). See `docs/taxonomy-admin.md`, `docs/api-using.md` § Taxonomy.

## Media routes (private)

`API_PRIVATE_ROUTES.media` — `src/api/callers/media/media-factory.ts (+ media-browser.ts)`, `useMediaFiles`. Used by `MediaCollectionDialog` (thumbnail, preview video, Quill embeds). See `docs/media-collection.md`.

## Error handling rules

1. Never show BE `message` in UI.
2. Use `toastApiError(tErrors, error)` in `catch` blocks after service calls.
3. Use `translateApiErrorCode(tErrors, code)` for Server Action results.
4. Client form validation uses separate `*.validation.*` namespaces — not `errors.codes.*`.
5. Authenticated transport reporter (`transport/api-transport.ts` → `reportApiError`) must **not** log or store BE body `message`, tokens, cookies, session IDs, Authorization headers, or sensitive request/response bodies. For `ApiHttpError`, reporter builds FE-owned copy from status (+ appCode); it must **not** reuse `error.message` when that string was derived from BE body. Keep raw body only on `ApiHttpError.response.data` for code mappers (never print that body in logs).
6. **Reporter matrix (no extra env / feature flag):**
   - **Expected (never log, never Zustand):** `ApiRefreshRequiredError` only (readonly/no-context boundary cannot refresh). Do **not** treat guest `GET /me` 401, `ERR_BLOCKED_BY_CLIENT`, or all status &lt; 500 as noise.
   - **Logged when `isServer()` OR `NODE_ENV === "development"`:** HTTP **4xx** (including guest `GET /me` 401), HTTP **5xx**, `ApiTimeoutError`, `ApiAbortError`, `ApiNetworkError` (including `ERR_BLOCKED_BY_CLIENT`), `ApiResponseParseError`, `ApiPolicyError`, `ApiRequestReplayError`.
   - **Console `[API]` (sanitized):** `isServer() || NODE_ENV === "development"`. Production **browser** never prints custom `[API]`. Log line uses FE-owned message (timeout/abort/network/parse text or `HTTP ${status}` / `policy ${code}`) — never tokens/cookies/session/Authorization/bodies.
   - **Zustand `pushApiError`:** browser only (not server), same logged set.
   - **`toastApiError`:** UI uses numeric `code` → i18n; development may `console.debug({ code, message })` for diagnosis.
7. Browser refresh BFF (`POST /api/auth/refresh`): upstream `ApiTimeoutError` → HTTP **504**; other network failures → **502**. Classify with `instanceof ApiTimeoutError`, never regex on `error.message` for timeout mapping (blocked-by-client detection may use a safe substring on the live error/cause only). Error DTO to the browser uses allowlisted codes + fixed safe messages only.
8. `parseMaxAgeForCookie`: Max-Age digits must end at `;`, whitespace, or end-of-attribute; malformed suffix → `undefined` (fail closed).
9. Authenticated/`ApiTransport` traffic always uses `cache: "no-store"` on **browser and server**.
10. Server Actions import `create*Callers` from `*-factory.ts` only — never from a file that top-level-imports `browserApiMethods` / Zustand.

See `docs/api-using.md` § API error i18n.

## Rules
- Do not call native `fetch` directly for MyCourse authenticated/private API routes.
- Use constants from `src/constants/api-route.ts`.
- Use `raw*` helpers only for refresh/low-level paths.
- `refreshBrowserSession` has **no** `AbortSignal` parameter — authenticated public options intentionally omit signal; adapter single-flight only.
