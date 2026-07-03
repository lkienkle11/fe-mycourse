# Instructor application page (user)

_Last audited: 2026-07-03 — section 6 `TaxonomySelect` full-width wrapper; shared `SearchableSelect` unchanged._

Public authenticated page for learners to submit and manage their **instructor application**. Admin review UX remains in [`instructor-admin.md`](./instructor-admin.md).

**BE contract:** `be-mycourse/docs/modules/instructor.md`, `be-mycourse/docs/api_swagger.yaml`

---

## Route

| URL | App route | Screen |
|-----|-----------|--------|
| `/{locale}/become-instructor` | `src/app/[locale]/(web)/become-instructor/page.tsx` | `BecomeInstructorPage` (`src/screen/common/instructor/become-instructor-page.tsx`) |

- Layout: `(web)` — site `Header` + `Footer` (same as home).
- Route constant: `PUBLIC_ROUTES.becomeInstructor` → `"/become-instructor"` in `src/constants/route.ts`.

---

## Module layout (`src/lib/instructor-application/`)

Feature logic lives under one namespace; components only render UI.

| File / folder | Responsibility |
|---------------|----------------|
| `get-page-state.ts` | Page state resolver (semantic names) |
| `page-state.ts` | `InstructorApplicationPageState` type + re-export `INSTRUCTOR_PAGE_STATE` |
| `form-state.ts` | Form model, prefill from `GET /me`, submit payload mapper |
| `helpers.ts` | `resolveInstructorApplicationProfile`, `resolveInstructorDisplayName` |
| `types.ts` | Combobox / company-search UI types only |
| `remote-data.ts` | Cloudflare JSON datasets + session cache |
| `combobox.ts` | Job/company suggest merge + **query cache** |
| `wikidata-company.ts` | Wikidata search port |
| `mock-*.ts` | Offline fallbacks |

**Constants:** `src/constants/instructor-application.ts` — `YEAR_EXPERIENCE_BUCKETS`, page-state type.

**API/domain types:** `src/types/instructor.ts` — single source for `YearsExperienceCode`, `MyInstructorApplication`, payloads.

**UI:** `src/components/features/instructor/become-instructor-application/` — `application-form`, `sections`, `panels`, `combobox-fields`, `taxonomy-select` (section 6 full-width wrapper); render only.

---

## Page state resolver

Docs use labels **A–H** for product discussion. **Runtime code uses semantic names** from `InstructorApplicationPageState`:

| Doc | Runtime state | Condition |
|-----|---------------|-----------|
| A | `unauthenticated` | Not logged in |
| G | `approved` | `review_status === "approved"` (before P68) |
| H | `rejected_contact_admin` | `rejection_count >= 5` |
| B | `submit_blocked` | Effective P68 |
| C | `ready_to_apply` | No application / eligible first submit |
| D | `pending_review` | `pending` within SLA |
| E | `returned_for_revision` | `returned` |
| F | `rejected_can_resubmit` | `rejected`, `rejection_count < 5` |

Sources: auth session, `GET /api/v1/instructor-applications/me`, `GET /api/v1/me/permissions` (P68).

`getPageState()` in `src/lib/instructor-application/get-page-state.ts` implements the priority order in the table above.

---

## Page layout (Tailwind)

Mapped from code-temp `renderPage()`:

```
Navbar (site header)
Hero (content-height, primary #3dcbb1) — title + subtitle at top; no breadcrumb
TabBar (48px) — "Application info" | "Rejection history" (or "Contact admin" in rejected_contact_admin)
Content (max-w-[1200px], 2-col desktop) — page shell `min-h-[calc(100svh-4rem)]` flex column (this route only; web layout unchanged) so footer sits at viewport bottom on short tabs; history panel `flex-1` fills remaining height
  ├── main — 6 form sections
  └── aside (w-80, sticky lg:block, accordion on mobile)
```

### Form sections (numbered in UI)

1. Professional summary (`headline`, `current_job_title` / `current_company` comboboxes, `years_of_experience` segmented control)
2. Bio (`bio` textarea)
3. CV + links (`cv_file_id` **PDF only**; `linkedin_url`, `github_url`, `portfolio_links` ≤5)
4. Certificates (≤10) — optional collapsible
5. Intro video (`intro_video_file_id`, `visibleTabs={["video"]}`) — optional collapsible
6. Expertise (`topic_ids` 1–5, `skill_ids` 1–15) — `TaxonomySelect` in `taxonomy-select.tsx` wraps shared `SearchableSelect` with `grid w-full` + `triggerClassName="w-full min-w-0"` so pickers span the section width. **Do not** change `src/components/shared/searchable-select.tsx` (also used by `instructor-expertise-page.tsx` with fixed `w-[280px]` / `max-w-md`).

**`SearchableSelect` consumers (do not break):**

| File | Usage | Width |
|------|-------|-------|
| `become-instructor-application/taxonomy-select.tsx` | Section 6 topic/skill pickers | Full section width |
| `instructor-expertise-page.tsx` | Instructor + topic/skill add pickers | `max-w-md` / `w-[280px]` |

---

## API layer

| Action | Method | Path |
|--------|--------|------|
| Bootstrap / prefill | GET | `/api/v1/instructor-applications/me` — P45 |
| First submit (`ready_to_apply`) | POST | `/api/v1/instructor-applications` — P45 |
| Resubmit (`returned_for_revision` / `rejected_can_resubmit`) | PUT | `/api/v1/instructor-applications/me` — P45 |
| State H contact | POST | `/api/v1/instructor-applications/contact-admin` — P45 + server `rejection_count >= 5`; response `{ ticket_id, status }` |
| Permission gate | GET | `/api/v1/me/permissions` |
| Taxonomy pickers | GET | `/api/v1/taxonomy/topics`, `/api/v1/taxonomy/skills` |

**FE files:** `src/api/callers/instructor/instructor.ts`, `src/hooks/instructor/use-my-instructor-application.ts`, `src/types/instructor.ts`, `src/schema/instructor/instructor.ts`, i18n `instructor.application.*`.

**Vietnamese copy (`vi.ts` → `instructor.application`):** job-title field labels use **「Vai trò」** (not 「Chức danh」) — `form.jobTitle`, `form.jobTitlePlaceholder`, `sidebar.req3`. Validation messages under `instructor.validation` already use 「vai trò」. Admin `instructor.profileView.currentJobTitle` keeps 「Chức danh」 (separate screen).

---

## Remote combobox data

Port from `code-temp/` — HTTP via **`rawFetch`** from `src/api/raw-http.ts` (timeout, signal) for third-party URLs. Privacy: user queries are sent from the browser to HH.ru / Wikidata / Cloudflare static JSON.

| Dataset | URL | Fallback |
|---------|-----|----------|
| Job titles | `https://du-lieu-ho-so.pages.dev/chuc-danh.json` | `mock-job-titles.ts` |
| Companies | `https://du-lieu-ho-so.pages.dev/cong-ty.json` | `mock-companies.ts` |
| Live job search | `https://api.hh.ru/suggests/vacancy_search_keyword?text=` | merge + dedupe |
| Live company | Wikidata `wbsearchentities` + SPARQL | `wikidata-company.ts` |

**Session caches:**

- Dataset load cache in `remote-data.ts` (full JSON once per session).
- **Query cache** in `combobox.ts` — keyed by normalized query string; repeated focus/type with same query does not re-hit third-party APIs.

Merge semantics: Wikidata + Cloudflare by domain/alias; fallback id prefix `fallback:` / `local:`; source note by search state.

**Company combobox contract:**

- Free-text typing or clearing the company input resets **all** snapshot fields (`current_company_id`, `current_company_domain`, `current_company_description`, `current_company_location`) via `applyCompanyFreeText()` in `form-state.ts` — only a picked suggestion repopulates metadata.
- Dropdown items render **title** (bold) + **description** + **location** on separate muted lines (not merged into one string).
- Source note states: `idle` (hidden) | `searching` | `no_results`. Empty results after remote search + mock datasets show `no_results` only — no separate offline/fallback banner.

**Combobox UX:** do not render internal option ids (`remote:`, `hh:`, `custom:`) to end users; sync inner query via `useEffect` on value prop — no remount `key` on combobox fields.

---

## Admin profile shape

List/detail for managed profiles and applications use **`latest_submission.profile`**. Use `resolveInstructorApplicationProfile()` from `src/lib/instructor-application/helpers.ts` — never read legacy top-level `profile` alone.

---

## PDF preview (`PreviewPdf`)

Admin CV preview uses `src/components/shared/preview-pdf.tsx` — thin wrapper around **`@react-pdf-viewer/core`** + **`@react-pdf-viewer/default-layout`** (toolbar, zoom, sidebar). PDF.js worker is loaded from the bundled **`pdfjs-dist`** package (`pdf.worker.min.js?url` import), not an external CDN.

---

## Submit UX

- Confirm dialog before submit (SLA 5-day message).
- `ready_to_apply` → `POST`; `returned_for_revision` / `rejected_can_resubmit` → `PUT /me`.
- Success toast + refetch `GET /me`.

### Status banners (`StatusBanner` in `sections.tsx`)

| State | Body copy (i18n) |
|-------|------------------|
| `pending_review` | `pending.dateSubmitted` (`Ngày nộp {date}` / `Submitted on {date}`) + `pending.body` (5-day SLA) |
| `returned_for_revision` | Edit/resubmit prompt only — no “does not count toward rejection limit” clause |

---

## Related docs

- [`instructor-admin.md`](./instructor-admin.md)
- [`pages.md`](./pages.md), [`router.md`](./router.md), [`screens.md`](./screens.md)
- [`components.md`](./components.md), [`modules.md`](./modules.md)
