# Pages (`fe-mycourse`)

_Last audited: 2026-06-05 (course collaboration editor + review queue)._

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
| `/{locale}/instructor/courses/{courseId}` | `src/app/[locale]/instructor/courses/[courseId]/page.tsx` | `InstructorCourseEditorPage` | Implemented |
| `/{locale}/instructor/tickets` | `src/app/[locale]/instructor/tickets/page.tsx` | `InstructorTicketsPage` | Implemented |
| `/{locale}/admin/courses` | `src/app/[locale]/admin/courses/page.tsx` | `CourseReviewPage` (`scope="admin"`) | Implemented |
| `/{locale}/admin/instructors/roster` | `src/app/[locale]/admin/instructors/roster/page.tsx` | `AdminInstructorRosterPage` → `InstructorRosterPage` | Implemented |
| `/{locale}/admin/instructors/approvals` | `…/approvals/page.tsx` | `AdminInstructorApprovalsPage` → `InstructorApprovalsPage` | Implemented |
| `/{locale}/admin/instructors/profiles` | `…/profiles/page.tsx` | `AdminInstructorProfilesPage` → `InstructorProfilesPage` | Implemented |
| `/{locale}/admin/instructors/expertise` | `…/expertise/page.tsx` | `AdminInstructorExpertisePage` → `InstructorExpertisePage` | Implemented |
| `/{locale}/admin/instructors/tickets` | `…/tickets/page.tsx` | `AdminInstructorTicketsPage` → `InstructorTicketsAdminPage` | Implemented |
| `/{locale}/sysadmin/instructors/{roster,approvals,profiles,expertise,tickets}` | `src/app/[locale]/sysadmin/instructors/*/page.tsx` | `SysadminInstructor*Page` → same shared screens | Implemented |
| `/{locale}/sysadmin` | `src/app/[locale]/sysadmin/page.tsx` | `SysadminDashboardPage` (placeholder) | Implemented |
| `/{locale}/sysadmin/courses` | `src/app/[locale]/sysadmin/courses/page.tsx` | `CourseReviewPage` (`scope="sysadmin"`) | Implemented |
| `/{locale}/admin/taxonomy/{resource}` | `src/app/[locale]/admin/taxonomy/*/page.tsx` | `AdminTaxonomy*Page` → `TaxonomyListPage` (`src/screen/common/taxonomy/`) — resource: levels, topics, outcomes, skills, tags | Implemented |
| `/{locale}/sysadmin/taxonomy/{resource}` | `src/app/[locale]/sysadmin/taxonomy/*/page.tsx` | `SysadminTaxonomy*Page` → same `TaxonomyListPage` (sysadmin menu) | Implemented |
| `/{locale}/*` (unknown path) | `src/app/[locale]/not-found.tsx`, `(web)/not-found.tsx`, `src/app/not-found.tsx` | `NotFoundPage` — localized 404 with Header + CTA | Implemented |

## Layout chain

- `src/app/layout.tsx` — fonts, Sonner `<Toaster />`
- `src/app/[locale]/layout.tsx` — `NextIntlClientProvider`, `AppProviders`
- `src/app/[locale]/(web)/layout.tsx` — `Header`, `<main>`, `Footer` (web routes only)
- `src/app/[locale]/admin|instructor|sysadmin/layout.tsx` — `DashboardLayout` (no site footer)

## Auth UX (not dedicated login/signup pages)

| Flow | Where it lives |
|------|----------------|
| Login / Sign up | Modal only — `LoginSignupPopup` in `header.tsx` (`LoginContent` / `SignupContent`) |
| Email confirm | Dedicated page `/{locale}/confirm-email?token=…` |
| Logout | Dedicated page `/{locale}/logout` (also linked from user menu) |

`PUBLIC_ROUTES` (`src/constants/route.ts`): `home`, `confirmEmail`, `logout` — no `auth.login` / `auth.signup` route constants.

## Planned / not implemented

| URL | Notes |
|-----|-------|
| `/{locale}/auth/login` | Optional future page; today login is modal-based |
| `/{locale}/courses` | Marketing/courses listing (nav placeholders only) |
| Dedicated signup page | Not planned — `SignupContent` stays in `LoginSignupPopup` |
| Further `/{locale}/admin/*` beyond taxonomy + instructors + course review | Placeholder sidebar links only (users, …) |

See also [`screens.md`](./screens.md), [`router.md`](./router.md), [`taxonomy-admin.md`](./taxonomy-admin.md), [`instructor-admin.md`](./instructor-admin.md).
