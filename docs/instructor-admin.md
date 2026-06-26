# Instructor management (FE)

_Last audited: 2026-06-17 (course info tab load performance: `include_outline`, `include_images`; browser-verified reject-fork UI)._

Admin and sysadmin dashboards manage instructors via BE `/api/v1/instructors`, `/instructor-applications`, `/instructor-profiles`, `/instructor-expertise-*` (junction), and `/instructor-tickets`. Instructors use `/instructor/tickets` for their own support tickets (create, thread, close).

## Routes

| Screen | Admin | Sysadmin | Instructor role |
|--------|-------|----------|-----------------|
| Roster | `/admin/instructors/roster` | `/sysadmin/instructors/roster` | — |
| Applications (approvals) | `/admin/instructors/approvals` | `/sysadmin/instructors/approvals` | — |
| Profiles | `/admin/instructors/profiles` | `/sysadmin/instructors/profiles` | — |
| Expertise (topics + skills) | `/admin/instructors/expertise` | `/sysadmin/instructors/expertise` | — |
| Tickets (admin view, no close) | `/admin/instructors/tickets` | `/sysadmin/instructors/tickets` | — |
| My tickets | — | — | `/instructor/tickets` |
| My courses | — | — | `/instructor/courses` |
| Course editor | — | — | `/instructor/courses/{courseId}/{info\|outline\|collaborators\|pricing\|certificate}` |
| Course reviews | `/admin/courses/reviewing` | `/sysadmin/courses/reviewing` | — |
| Review preview | — | `/sysadmin/courses/reviewing/{courseId}/preview` | — |
| Course catalog (all / trash) | `/admin/courses/all`, `/admin/courses/trash` | `/sysadmin/courses/all`, `/sysadmin/courses/trash` | — |

Overview shells remain at `/admin`, `/sysadmin`, and `/instructor` (placeholder dashboard pages). Course review queues are implemented for admin/sysadmin; instructor course authoring is implemented under the instructor dashboard. **Review queue** (`CourseReviewPage`): table columns are course, owner, and version (no status column — the queue only lists pending submissions). Each row uses shared `CourseReviewRowActions` (⋮ menu — sysadmin: Preview / Approve / Reject; admin: Approve / Reject). All/Trash catalog rows use shared `CourseAdminTableActionsMenu`.

## Screen layer

Instructor management now uses **app route → shared screen** for admin and sysadmin.

| Layer | Path | Role |
|-------|------|------|
| App route | `src/app/[locale]/admin/instructors/{roster,approvals,profiles,expertise,tickets}/page.tsx` | Imports shared instructor screens directly |
| App route | `src/app/[locale]/sysadmin/instructors/.../page.tsx` | Same shared screens for sysadmin |
| App route | `src/app/[locale]/instructor/tickets/page.tsx` | Re-exports `InstructorTicketsPage` |
| Role screen | `src/screen/instructor/tickets/page.tsx` | `InstructorTicketsPage` (instructor-only UX) |
| Shared screen | `src/screen/common/instructor/*.tsx` | Roster, approvals, profiles, expertise, admin tickets |

Shared exports: `src/screen/common/instructor/index.ts`.

## Sidebar navigation

Instructor group on **admin** and **sysadmin** (`ADMIN_DASHBOARD_ITEMS` / `SYSADMIN_DASHBOARD_ITEMS`):

- Parent: `titleKey` → `dashboard.instructor.menu.group` (via `useTranslations("dashboard")` in `DashboardSidebar`)
- Children: roster, approvals, profiles, expertise, tickets — keys `dashboard.instructor.menu.*`
- Icons: `INSTRUCTOR_MENU_ICONS` in `src/constants/dashboard/instructor-icons.ts`
- Group visibility: `INSTRUCTOR_GROUP_READ_PERMISSIONS` with `permissionMode: "any"` (`src/constants/instructor/resources.ts`)

**Instructor** dashboard menu (`INSTRUCTOR_DASHBOARD_ITEMS`):

- **My Courses** → `/instructor/courses`
- **Support tickets** → `/instructor/tickets`

`/instructor/courses` route base is centralized in `PRIVATE_ROUTES.instructor.courses` (`src/constants/route.ts`), while the route-backed course editor uses `PRIVATE_RESOURCE_ROUTES.instructor.courseEditor` (`/instructor/courses/:courseId/info`) plus `PRIVATE_RESOURCE_ROUTES.instructor.courseEditorTab` (`/instructor/courses/:courseId/:tab`). Runtime href generation reuses `instructorCourseEditorHref(courseId)` for the canonical info tab and `instructorCourseEditorTabHref(courseId, tab)` for the other 4 tab routes. The shared route adapter lives in `src/components/features/instructor/instructor-course-editor-route.tsx`, so `src/app/**` keeps only minimal page glue.

Instructor layout authorization now accepts either `instructor:modify` or `course_instructor:read`, so course collaborators are not blocked by the dashboard shell.

## Permissions (P41–P58)

Mirror BE `AllPermissions` in `src/constants/permissions.ts` and `PERMISSION_IDS` in `permission-ids.ts`:

| Area | Permission names (examples) |
|------|-----------------------------|
| Roster | `instructor_roster:read`, `:create`, `:delete` |
| Applications | `instructor_application:read`, `:create`, `:update`, `:delete`, `:approve`, `:reject` |
| Profiles | `instructor_profile:read`, `:create`, `:update`, `:delete` |
| Expertise | `instructor_expertise:read`, `:create`, `:delete` |
| Ticket close | `instructor_ticket:close` (instructor role on `/instructor/tickets`) |

UI gates use `PermissionGate` and sidebar filtering via `useFilteredDashboardItems`.

## API layer

- Routes: `API_PRIVATE_ROUTES.instructor` in `src/constants/api-route.ts`
- Callers: `src/api/callers/instructor/instructor.ts`
- Hooks (SWR): `src/api/hooks/instructor/` — roster, applications, profiles, expertise topics/skills, tickets, messages
- Types: `src/types/instructor.ts` (single profile payload shape for applications and profiles)

Course authoring / review reuses the same dashboard and API patterns:

- instructor routes + review routes live in `API_PRIVATE_ROUTES.course`
- callers in `src/api/callers/course/course.ts`
- hooks in `src/api/hooks/course/useCourses.ts`
- types in `src/types/course.ts`

**My Courses** (`InstructorCoursesPage`): create dialog sends `{ title }` only; slug preview is read-only (`slugifyName(title)`). Title must have ≥5 non-whitespace characters (FE `courseCreateSchema` + BE `nonwhitespace_min=5`).

**Course editor basic info** (`/instructor/courses/:id/info`): title is editable on save; BE recomputes `courses.slug` from the new title. About course uses `DeltaEditor` with `mediaEmbedKinds={ABOUT_COURSE_MEDIA_EMBED_KINDS}` (`["image","document"]` module constant), `allowLink`, and custom placeholder — Quill Delta JSON with font picker, hyperlinks on selected text (brand color `#3dcbb1` / `var(--base-primary)`, underline, pointer cursor) **and image embeds** (toolbar link dialog or **image overlay link-edit button** → `DeltaEditorLinkDialog` edit/remove; **link text color** via toolbar `linkColor` picker next to Link button), **image embed 4-corner drag-resize** (NW/NE/SW/SE handles; persists `width`/`height`), image/document embeds via dialog, paste, or drag-and-drop (video disabled on this tab); **link Edit/Remove** (Quill Snow tooltip) updates or strips the full same-URL segment across heading/list block gaps; embed × remove calls `onDelete` → `deleteMediaFile`; paste/drop upload via `useDeltaEditorMediaHandlers` → `onObjectEmbedded`. Save uses `courseBasicInfoSchema` + `toUpdateCourseBasicInfoPayload` (all required basic-info fields including `title`; preview video optional). After each successful save, `handleSaveBasicInfo` writes the returned `draft_version.row_version` into form state and `mutateDetail` so the next save sends the current `expected_row_version` (avoids `409` / code `3005` on consecutive saves). Learning outcome is a single required dropdown (exactly one `outcome_ids` entry).

**Course editor header** (`editor-page.tsx`): status badge from active draft (or live when no draft). Version badges: `course.common.versionBadge` shows edit `version_no` (`draft_version` when present); when both `draft_version` and `live_version` exist, `course.common.publishedVersionBadge` shows the approved number. Editing is enabled only when `draft_version.status === "DRAFT"` (`IN_REVIEW` / legacy `REJECTED` are read-only in tabs). After admin reject, BE forks a new draft at `max(version_no)+1`; UI shows `last_rejection_reason` (or legacy `draft_version.rejection_reason` on `REJECTED` pointer) in a destructive alert. Primary action buttons (**owner-only** — hidden when `collaborator_role !== "OWNER"`): **Prepare draft** when approved-only; **Submit for review** when `DRAFT`; **Reopen draft** only for legacy `REJECTED` pointer (new data auto-forks on reject). Collaborator role label: `course.common.collaboratorRole.EDITOR` → **"Cộng tác viên"** (vi) / **"Collaborator"** (en).

**Load performance:** `useCourseDetail(courseId)` — một SWR cache key per course (full detail kèm outline); chuyển tab info/outline/collaborators **không** refetch, dùng cache. Lần đầu vào editor fetch một lần; skeleton chỉ khi `!data && isLoading`. Tab info: `useTaxonomyList` với `include_images: false` (chỉ khi `tab === "info"`).

**Course editor outline** (`/instructor/courses/:id/outline`): ... Outline cards show ... **locale-aware duration label** via `formatDurationMs(buildDurationUnits(tCommon), …)` — suffixes from `course.common.durationUnitHours|Minutes|Seconds` in `src/messages/{en,vi}.ts`, not hardcoded in `duration.ts`. Section / lesson / item row actions are grouped in `CourseOutlineRowActions` (shared `DropdownMenu`; label `course.common.actions`; menu items from `CourseOutlineItemKind`). Sub-lesson create/edit dialog (`CourseSubLessonDialog`) switches VIDEO / TEXT / QUIZ fields via a kind→renderer map; **TEXT and QUIZ** include shared `SubLessonDurationFields` (Hours / Minutes / Seconds → `estimated_duration_ms` on save); **VIDEO** shows read-only duration from the selected `MediaFile.duration` (no H/M/S inputs). Dialog body uses `overflow-x-hidden` and `break-all` so long video IDs/URLs wrap inside the modal (no horizontal scrollbar). Drag reorder (sections, lessons, lesson items) uses shared `SortableList` with mobile touch support (`TouchSensor` + 44px drag handle); applies **optimistic UI** via `useCourseOutlineReorder`: order updates in SWR cache before the reorder API runs; success shows `course.editor.toast.sectionsReordered` / `lessonsReordered` / `itemsReordered` and merges the API response; failure shows `toastApiError` and restores the pre-drag snapshot.

**Sub-lesson save**: before sending the payload, `saveSubLesson` calls `validateSubLessonFormContent` (VIDEO/TEXT/QUIZ content rules, including `allow_multiple`), `validateSubLessonDurationForm` (TEXT/QUIZ duration `0`–`999h` in ms), and enforces `is_preview = false` for `QUIZ` sub-lessons regardless of form state. `buildSubLessonEstimatedDurationPayload` sends `estimated_duration_ms` for TEXT/QUIZ only (omitted for VIDEO). QUIZ single-choice (`allow_multiple = false`) must have exactly one correct answer; the editor dialog enforces radio-style correct-answer selection and defaults to the first option when switching from multiple-choice.

**Submit for review** (`handleSubmitReview`): **only rendered for `OWNER`** (`canManageReviewWorkflow` in `editor-page.tsx`). Clicking **Submit for review** opens `ConfirmActionDialog` (`course.editor.submitConfirm`) explaining that editing is locked until approval or rejection; on confirm, calls `validateCourseSubmitReadiness` (from `src/lib/utils/course.ts`) before the API. Returns `boolean` — dialog closes when POST submit succeeds even if a follow-up `refreshDetail()` fails (refresh is best-effort; failure toasts `course.editor.toast.refreshAfterSubmitFailed`). Validation checks (in order): draft version present, basic info schema passes (`courseBasicInfoSchema`), ≥1 collaborator, ≥1 section, each section ≥1 lesson, each lesson ≥1 sub-lesson, and each sub-lesson content valid. Sub-lesson rules: VIDEO must have `media_file_id`, TEXT must have ≥1 non-whitespace character, QUIZ must not be `is_preview`, must have prompt, ≥1 option, ≥1 correct answer, and single-choice quizzes must not mark more than one option correct. All failures surface as i18n keys in `course.validation.*`; see `src/messages/{en,vi}.ts`. QUIZ content rules are schema-backed via `courseQuizOptionSchema` in `src/schema/course/course.ts`. BE also enforces owner-only on `POST …/submit-review` (`403` / code `3003` for `EDITOR`). Detailed flow in [`docs/logic-flow.md` §11](./logic-flow.md).

Reject application requires `rejection_reason` (1–2000 chars) via `InstructorApprovalActions`.

## Validation and API errors

- **Schemas**: `src/schema/instructor/instructor.ts` — email, rejection reason, expertise topic/skill, ticket subject/message.
- **Validation namespace**: `instructor.validation.*` in `src/messages/{en,vi}.ts`.
- **Required fields UI**: `RequiredLabel` on rejection reason (`InstructorApprovalActions`), expertise topic/skill pickers (`InstructorExpertisePage`), ticket subject/message (`InstructorTicketsPage`).
- **Pre-submit validation**: Zod `safeParse` + `toastValidationError` before API (email, rejection reason, topic_id, skill_id, ticket subject/body).
- **Pre-submit**: `instructorEmailSchema`, `instructorRejectionReasonSchema`, `instructorTicketSchema` — toast `instructor.validation.*` on failure.
- **API failures**: all roster/approvals/expertise/tickets/profiles catches → `toastApiError(tErrors, error)`; do not use `instructor.common.errorGeneric` for API responses.

## Shared UI components

`src/components/features/instructor/`:

| Component | Purpose |
|-----------|---------|
| `InstructorProfileViewDialog` | Read-only profile popup (approvals / roster / profiles) with identity block (`full_name`, `avatar` + fallback) |
| `InstructorRosterPickerDialog` | Multi-select roster add dialog (search, pagination, responsive overflow) backed by `GET /instructors/roster-candidates` |
| `InstructorApprovalActions` | Approve / reject (reason required) / delete application |

Reuses: `DataTable`, `ConfirmDeleteDialog`, `PermissionGate`, taxonomy list hooks for expertise pickers (`useTaxonomyList` for topic/skill **names**; list rows show names, not raw IDs).

## Expertise UX

- Pick instructor from roster dropdown (name + email).
- **Topics / skills tabs:** add from ACTIVE taxonomy lists; display assigned rows by **taxonomy name** (map `topic_id` / `skill_id` via loaded taxonomy rows).
- Already-assigned topic/skill IDs are hidden from add dropdowns.

## Identity rendering

- Roster table includes an `Avatar` column.
- Avatar rendering rule is shared across instructor screens:
  - use API `avatar` URL when present
  - otherwise fallback to generated initials via `pickCharacter(full_name)`.

## Tickets UX

| Actor | Page | Close ticket | Post message when closed |
|-------|------|--------------|---------------------------|
| Admin / sysadmin | `InstructorTicketsAdminPage` | No | No |
| Instructor | `InstructorTicketsPage` | Yes (`instructor_ticket:close`) | Composer disabled when `status === "closed"` |

## i18n

- Screen copy: `instructor.*` in `src/messages/en.ts` and `vi.ts` (roster, approvals, profiles, expertise, tickets, common, **validation**).
- API errors: global `errors.codes.*` (not under `instructor.*`).
- Sidebar labels: `dashboard.instructor.menu.*` (same keys as taxonomy uses `dashboard.taxonomy.menu.*`).

## Out of scope (FE)

- Public “become instructor” page (BE submit API exists; no marketing route).
- Assignments / activity log (BE stubs → toast “coming soon” when wired).
- Public learner course storefront and learner lesson player UI.

## Related docs

- BE contract: `be-mycourse/docs/modules/instructor.md`
- FE routes: [`router.md`](./router.md), [`pages.md`](./pages.md), [`screens.md`](./screens.md)
- Quality gate: [`quality.md`](./quality.md), `temporary-docs/tieu-chuan-check-be-fe/fe-mycourse.md`
