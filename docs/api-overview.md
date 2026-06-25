# API Overview (`fe-mycourse`)

_Last audited: 2026-06-17 (course/taxonomy read-path performance params + instructor course routes)._


## Scope
Frontend API layer lives in `src/api/` and is used by `src/actions/` and client hooks.

## Layers
- `src/api/instance.ts`: Axios instance, auth header attach, refresh flow.
- `src/api/methods.ts`: typed helpers `apiFetch/apiPost/apiPut/apiPatch/apiDelete/apiOptions`.
- `src/api/raw-http.ts`: raw HTTP helpers for refresh path.
- `src/api/callers/auth/auth.ts`: domain callers (auth + Me API).
- `src/api/hooks/auth/useAuth.ts`: SWR hook for `/api/v1/me`.

## Contracts
- Response envelope: `ApiResponse<T>` in `src/types/api.ts`.
- Low-level helper return type: `ApiResult<T>` with `data/statusCode/headers/cookies`.
- Error code map: `ApiErrorCode` in `src/constants/api-error-code.ts` (1:1 with BE `errcode_codes.go`).
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

Mounted under `API_PRIVATE_ROUTES.instructor` — see `src/api/callers/instructor/instructor.ts` and `docs/instructor-admin.md`:

- `GET/POST/DELETE /api/v1/instructors` (roster)
- `GET/POST /api/v1/instructor-applications`, approve/reject, delete
- `GET/POST/PATCH/DELETE /api/v1/instructor-profiles`, `GET …/me`
- `GET/POST/DELETE …/instructors/:id/expertise/topics|skills`
- `GET/POST /api/v1/instructor-tickets`, messages, `POST …/close`

## Course routes (private)

Mounted under `API_PRIVATE_ROUTES.course` — see `src/api/callers/course/course.ts`, `src/api/hooks/course/useCourses.ts`, and `docs/instructor-admin.md`:

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

`API_PRIVATE_ROUTES.taxonomy` — callers in `src/api/callers/taxonomy/taxonomy.ts`, hook `useTaxonomyList` in `src/api/hooks/taxonomy/useTaxonomy.ts`.

List query extends `ApiListQueryParams` with `search_by`, `search_value`, and optional `include_images` (`false` skips image URL hydration — course editor pickers only; admin CRUD screens keep default `true`).

## Media routes (private)

`API_PRIVATE_ROUTES.media` — `src/api/callers/media/media.ts`, `useMediaFiles`. Used by `MediaCollectionDialog` (thumbnail, preview video, Quill embeds). See `docs/media-collection.md`.

## Error handling rules

1. Never show BE `message` in UI.
2. Use `toastApiError(tErrors, error)` in `catch` blocks after service calls.
3. Use `translateApiErrorCode(tErrors, code)` for Server Action results.
4. Client form validation uses separate `*.validation.*` namespaces — not `errors.codes.*`.

See `docs/api-using.md` § API error i18n.

## Rules
- Do not call `axios` directly in features.
- Use constants from `src/constants/api-route.ts`.
- Use `raw*` helpers only for refresh/low-level paths.
