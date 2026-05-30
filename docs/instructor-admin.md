# Instructor management (FE)

_Last audited: 2026-05-29 (admin/sysadmin/instructor routes + shared screens)._

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

Overview shells remain at `/admin`, `/sysadmin`, and `/instructor` (placeholder dashboard pages).

## Screen layer

Same pattern as taxonomy: **app route → role screen → shared screen**.

| Layer | Path | Role |
|-------|------|------|
| App route | `src/app/[locale]/admin/instructors/{roster,approvals,profiles,expertise,tickets}/page.tsx` | Re-exports `AdminInstructor*Page` |
| App route | `src/app/[locale]/sysadmin/instructors/.../page.tsx` | Re-exports `SysadminInstructor*Page` |
| App route | `src/app/[locale]/instructor/tickets/page.tsx` | Re-exports `InstructorTicketsPage` |
| Role screen | `src/screen/admin/instructor/*/page.tsx` | Thin wrapper around shared page |
| Role screen | `src/screen/sysadmin/instructor/*/page.tsx` | Same for sysadmin |
| Role screen | `src/screen/instructor/tickets/page.tsx` | `InstructorTicketsPage` (instructor-only UX) |
| Shared screen | `src/screen/common/instructor/*.tsx` | Roster, approvals, profiles, expertise, admin tickets |

Shared exports: `src/screen/common/instructor/index.ts`.

## Sidebar navigation

Instructor group on **admin** and **sysadmin** (`ADMIN_DASHBOARD_ITEMS` / `SYSADMIN_DASHBOARD_ITEMS`):

- Parent: `titleKey` → `dashboard.instructor.menu.group` (via `useTranslations("dashboard")` in `DashboardSidebar`)
- Children: roster, approvals, profiles, expertise, tickets — keys `dashboard.instructor.menu.*`
- Icons: `INSTRUCTOR_MENU_ICONS` in `src/constants/dashboard/instructor-icons.ts`
- Group visibility: `INSTRUCTOR_GROUP_READ_PERMISSIONS` with `permissionMode: "any"` (`src/constants/instructor/resources.ts`)

**Instructor** dashboard menu (`INSTRUCTOR_DASHBOARD_ITEMS`): adds **Support tickets** → `/instructor/tickets` (`instructor_application:read` for list/create; `instructor_ticket:close` for close on thread).

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

Reject application requires `rejection_reason` (1–2000 chars) via `InstructorApprovalActions`.

## Shared UI components

`src/components/features/instructor/`:

| Component | Purpose |
|-----------|---------|
| `InstructorProfileViewDialog` | Read-only profile popup (approvals / roster / profiles) with identity block (`full_name`, `avatar` + fallback) |
| `ConfirmAddInstructorDialog` | Add roster member by email |
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

- Screen copy: `instructor.*` in `src/messages/en.ts` and `vi.ts` (roster, approvals, profiles, expertise, tickets, common).
- Sidebar labels: `dashboard.instructor.menu.*` (same keys as taxonomy uses `dashboard.taxonomy.menu.*`).

## Out of scope (FE)

- Public “become instructor” page (BE submit API exists; no marketing route).
- Assignments / activity log (BE stubs → toast “coming soon” when wired).
- Course instructor assignment UI (`course_instructors`).

## Related docs

- BE contract: `be-mycourse/docs/modules/instructor.md`
- FE routes: [`router.md`](./router.md), [`pages.md`](./pages.md), [`screens.md`](./screens.md)
- Quality gate: [`quality.md`](./quality.md), `temporary-docs/tieu-chuan-check-be-fe/fe-mycourse.md`
