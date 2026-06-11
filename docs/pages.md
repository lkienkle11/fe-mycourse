# Pages (`fe-mycourse`)

_Last audited: 2026-06-08 (validation + code-based API error i18n per screen)._

## Current pages

| URL | Route file | Screen / content | Status |
|-----|------------|------------------|--------|
| `/` | `src/app/page.tsx` | Redirect → `/vi` (default locale) | Implemented |
| `/{locale}` | `src/app/[locale]/(web)/page.tsx` | `HomePage` (`src/screen/common/home/page.tsx`) | Implemented |
| `/{locale}/confirm-email` | `src/app/[locale]/(web)/confirm-email/page.tsx` | `ConfirmEmailContent` → `confirmAction` | Implemented |
| `/{locale}/logout` | `src/app/[locale]/(web)/logout/page.tsx` | `LogoutContent` → `logoutAction` (+ cross-tab `broadcast:logout`) | Implemented |
| `/{locale}/admin` | `src/app/[locale]/admin/page.tsx` | `AdminDashboardPage` (placeholder dashboard) | Implemented |
| `/{locale}/instructor` | `src/app/[locale]/instructor/page.tsx` | `InstructorDashboardPage` (placeholder) | Implemented |
| `/{locale}/instructor/courses` | `src/app/[locale]/instructor/courses/page.tsx` | `InstructorCoursesPage` | Implemented |
| `/{locale}/instructor/courses/{courseId}/info` | `src/app/[locale]/instructor/courses/[courseId]/info/page.tsx` | `InstructorCourseEditorPage` (`tab="info"`) via shared `renderInstructorCourseEditorRoute` | Implemented |
| `/{locale}/instructor/courses/{courseId}/outline` | `src/app/[locale]/instructor/courses/[courseId]/outline/page.tsx` | `InstructorCourseEditorPage` (`tab="outline"`) via shared `renderInstructorCourseEditorRoute` | Implemented |
| `/{locale}/instructor/courses/{courseId}/collaborators` | `src/app/[locale]/instructor/courses/[courseId]/collaborators/page.tsx` | `InstructorCourseEditorPage` (`tab="collaborators"`) via shared `renderInstructorCourseEditorRoute` | Implemented |
| `/{locale}/instructor/courses/{courseId}/pricing` | `src/app/[locale]/instructor/courses/[courseId]/pricing/page.tsx` | `InstructorCourseEditorPage` (`tab="pricing"`) via shared `renderInstructorCourseEditorRoute` | Implemented |
| `/{locale}/instructor/courses/{courseId}/certificate` | `src/app/[locale]/instructor/courses/[courseId]/certificate/page.tsx` | `InstructorCourseEditorPage` (`tab="certificate"`) via shared `renderInstructorCourseEditorRoute` | Implemented |
| `/{locale}/instructor/tickets` | `src/app/[locale]/instructor/tickets/page.tsx` | `InstructorTicketsPage` | Implemented |
| `/{locale}/admin/courses` | `src/app/[locale]/admin/courses/page.tsx` | `CourseReviewPage` (`scope="admin"`) | Implemented |
| `/{locale}/admin/instructors/roster` | `src/app/[locale]/admin/instructors/roster/page.tsx` | `InstructorRosterPage` | Implemented |
| `/{locale}/admin/instructors/approvals` | `…/approvals/page.tsx` | `InstructorApprovalsPage` | Implemented |
| `/{locale}/admin/instructors/profiles` | `…/profiles/page.tsx` | `InstructorProfilesPage` | Implemented |
| `/{locale}/admin/instructors/expertise` | `…/expertise/page.tsx` | `InstructorExpertisePage` | Implemented |
| `/{locale}/admin/instructors/tickets` | `…/tickets/page.tsx` | `InstructorTicketsAdminPage` | Implemented |
| `/{locale}/sysadmin/instructors/{roster,approvals,profiles,expertise,tickets}` | `src/app/[locale]/sysadmin/instructors/*/page.tsx` | Same shared instructor screens as admin | Implemented |
| `/{locale}/sysadmin` | `src/app/[locale]/sysadmin/page.tsx` | `SysadminDashboardPage` (placeholder) | Implemented |
| `/{locale}/sysadmin/courses` | `src/app/[locale]/sysadmin/courses/page.tsx` | `CourseReviewPage` (`scope="sysadmin"`) | Implemented |
| `/{locale}/admin/taxonomy/{resource}` | `src/app/[locale]/admin/taxonomy/*/page.tsx` | `TaxonomyListPage` (`src/screen/common/taxonomy/`) — resource: levels, topics, outcomes, skills, tags | Implemented |
| `/{locale}/sysadmin/taxonomy/{resource}` | `src/app/[locale]/sysadmin/taxonomy/*/page.tsx` | Same shared `TaxonomyListPage` (sysadmin menu) | Implemented |
| `/{locale}/*` (unknown path) | `src/app/[locale]/not-found.tsx`, `(web)/not-found.tsx`, `src/app/not-found.tsx` | `NotFoundPage` — localized 404 with Header + CTA | Implemented |

## Layout chain

- `src/app/layout.tsx` — fonts, Sonner `<Toaster />`
- `src/app/[locale]/layout.tsx` — `NextIntlClientProvider`, `AppProviders`
- `src/app/[locale]/(web)/layout.tsx` — `Header`, `<main>`, `Footer` (web routes only)
- `src/app/[locale]/admin|sysadmin/layout.tsx` — `RoleDashboardLayout` → `DashboardLayout` (no site footer)
- `src/app/[locale]/instructor/layout.tsx` — `DashboardLayout` (no site footer)

## Auth UX (not dedicated login/signup pages)

| Flow | Where it lives |
|------|----------------|
| Login / Sign up | Modal only — `LoginSignupPopup` in `header.tsx` (`LoginContent` / `SignupContent`) |
| Email confirm | Dedicated page `/{locale}/confirm-email?token=…` |
| Logout | Dedicated page `/{locale}/logout` (also linked from user menu) |

Route constants:
- `PUBLIC_ROUTES` (`src/constants/route.ts`): public/no-login routes (`home`, `forgotPassword`, `confirmEmail`, `logout`)
- `PRIVATE_ROUTES` (`src/constants/route.ts`): login-required routes (`admin`, `instructor`, `sysadmin`, `account`)
- `PUBLIC_RESOURCE_ROUTES` / `PRIVATE_RESOURCE_ROUTES` (`src/constants/route.ts`): dynamic templates (`:param`) for resource pages
- Route builders/helpers live in `src/lib/navigation/routes.ts` (for example `instructorCourseEditorHref(courseId)` for `/instructor/courses/:courseId/info` and `instructorCourseEditorTabHref(courseId, tab)` for the route-backed editor tabs)

No `auth.login` / `auth.signup` route constants (login/signup stay modal-only).

## Current implementation notes

| Area | Status |
|------|--------|
| Login / Signup pages | Modal-only (`LoginSignupPopup`), no dedicated route pages |
| Admin pages | Implemented: dashboard shell, taxonomy, instructors, course review |
| Instructor pages | Implemented: dashboard shell, courses list/editor, tickets |
| Sysadmin pages | Implemented: dashboard shell, taxonomy, instructors, course review |

## Validation & API errors by screen

All user-facing API failures use `errors.codes.{numericCode}` via `translateApiErrorCode` / `toastApiError` — never the BE `message` string. Pre-submit checks use module-scoped `*.validation.*` keys (separate namespace). See [`patterns.md` §6b](./patterns.md) and [`api-using.md`](./api-using.md).

| Screen / flow | Client validation | API error display |
|---------------|-------------------|-------------------|
| Login / Signup modal | `auth` Zod keys via `loginSchema` / `registerSchema` | Inline `translateApiErrorCode(tErrors, result.code)` |
| Confirm email / Logout pages | — | Inline code-based errors |
| Taxonomy list + form dialog | `taxonomy.form.validation.*`, `RequiredLabel`, `FieldError`; create/edit remounts `TaxonomyFormDialog` via `formDialogKey` so `initialData` hydrates form + slug preview (controlled `open` does not invoke Radix `onOpenChange(true)`) | `toastApiError` on delete / create / update |
| Media collection + upload | `media.validation.*` (size, type, executable) | `toastApiError` |
| Instructor roster / approvals / expertise / tickets / profiles | `instructor.validation.*`, `RequiredLabel` on email/reject/topic/skill/ticket fields | `toastValidationError` pre-submit; `toastApiError` on API |
| Instructor courses list | `course.validation.title` on create dialog | `toastApiError` on create / delete |
| Instructor course editor | `courseBasicInfoSchema` via `react-hook-form + zodResolver`, route-backed tab panels, outline dialogs, `RequiredLabel`, `FieldError` | `toastValidationError` pre-submit; `toastApiError` on API |
| Admin/sysadmin course review | Reject reason required (`course.validation.rejectReason`) | `toastApiError` on approve / reject |

See also [`screens.md`](./screens.md), [`router.md`](./router.md), [`taxonomy-admin.md`](./taxonomy-admin.md), [`instructor-admin.md`](./instructor-admin.md), [`media-collection.md`](./media-collection.md), [`modules.md`](./modules.md).
