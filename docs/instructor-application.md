# Instructor application page (user)

_Last audited: 2026-07-02 — become-instructor page contract (states A–H), layout mapping from code-temp, API integration._

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

## State resolver (A–H)

Sources: auth session, `GET /api/v1/instructor-applications/me`, `GET /api/v1/me/permissions` (P68).

### Priority order (mandatory)

Implement `getPageState()` in this order — **do not** map P68 → State B before checking `review_status`:

1. **A** — not logged in
2. **G** — `review_status === "approved"` (wins over P68; user was approved via application flow)
3. **H** — `rejection_count >= 5`
4. **B** — effective `instructor_application:submit_blocked` (P68); pre-existing/roster instructor or system block
5. **C** — no application / eligible first submit
6. **D** — `pending` within SLA
7. **E** — `returned`
8. **F** — `rejected`, `rejection_count < 5`

### State B vs State G

| | State B | State G |
|---|---------|---------|
| Trigger | P68, user not in G/H | `review_status === "approved"` from `GET /me` |
| Context | Instructor from roster/legacy, or blocked by quota | Just approved through application flow |
| UI | Block card — cannot submit | Success CTA → `/instructor` |
| Note | User may have P68 | User also has P68 after approve, but **G is checked first** |

| State | Condition | UI |
|-------|-----------|-----|
| A | Not logged in | Login CTA |
| G | `review_status === approved` | Success CTA → `/instructor` |
| H | `rejection_count >= 5` | Tab "Contact admin" + rejection history |
| B | P68 (after G/H ruled out) | Block card + CTA to instructor area |
| C | Eligible first submit | Form + empty rejection history tab |
| D | `pending`, within SLA | Read-only form + pending banner |
| E | `returned` | Editable form + returned banner |
| F | `rejected`, count < 5 | Editable form + rejection tab |

Logic port: `temporary-docs/yeu-cau-lam-giang-vien/code-temp/script.ts` → `getPageState()` (update to match priority above).

### `getPageState()` reference (pseudocode)

```ts
function getPageState(auth, meResponse, permissions): PageState {
  if (!auth) return "A";
  if (meResponse?.review_status === "approved") return "G";
  if ((meResponse?.rejection_count ?? 0) >= 5) return "H";
  if (permissions.includes("instructor_application:submit_blocked")) return "B";
  if (!meResponse) return "C"; // GET /me → 404
  if (meResponse.review_status === "pending") return "D";
  if (meResponse.review_status === "returned") return "E";
  if (meResponse.review_status === "rejected") return "F";
  return "C";
}
```

`GET /me` returning **404** means no application row → State **C** (first submit), unless step 4 already returned **B** (roster instructor with P68, no application).

---

## Page layout (Tailwind)

Mapped from code-temp `renderPage()`:

```
Navbar (site header)
Hero (~280px, primary #3dcbb1)
TabBar (48px) — "Application info" | "Rejection history" (or "Contact admin" in State H)
Content (max-w-[1200px], 2-col desktop)
  ├── main — 6 form sections
  └── aside (w-80, sticky lg:block, accordion on mobile)
```

Design tokens: primary `#3dcbb1`, 8px spacing grid, `max-width: 1200px`.

### Form sections

1. Professional summary (`headline`, `bio`, `years_of_experience` segmented control)
2. Current role (`current_job_title` combobox, `current_company` combobox)
3. CV (`cv_file_id` — PDF via `MediaCollectionDialog`, `visibleTabs={["document"]}`)
4. Links (`linkedin_url`, `github_url`, `portfolio_links` ≤5)
5. Certificates (≤10)
6. Intro video (`intro_video_file_id` — `visibleTabs={["video"]}`)
7. Expertise (`topic_ids` 1–5, `skill_ids` 1–15 via taxonomy `SearchableSelect`)

---

## API layer

| Action | Method | Path |
|--------|--------|------|
| Bootstrap / prefill | GET | `/api/v1/instructor-applications/me` — permission `instructor_application:create` (P45) |
| First submit (State C) | POST | `/api/v1/instructor-applications` — P45 |
| Resubmit (State E/F) | PUT | `/api/v1/instructor-applications/me` — P45 (same as first submit; not P46) |
| Permission gate | GET | `/api/v1/me/permissions` |
| Taxonomy pickers | GET | `/api/v1/taxonomy/topics`, `/api/v1/taxonomy/skills` |

**FE files:**

- Routes: `API_PRIVATE_ROUTES.instructorApplications` in `src/constants/api-route.ts`
- Callers: `getMyInstructorApplicationService`, `submitInstructorApplicationService`, `resubmitInstructorApplicationService` in `src/api/callers/instructor/instructor.ts`
- Hook: `useMyInstructorApplication.ts`
- Types: extend `src/types/instructor.ts` — `RejectionRecord`, company snapshot, `YearsExperienceCode`, media read models, `can_resubmit`
- Schema: extend `src/schema/instructor/instructor.ts` — bio 100–2000, years enum, portfolio ≤5, certs ≤10, topics/skills limits
- i18n: `instructor.application.*` in `src/messages/{en,vi}.ts`

---

## Remote combobox data (`src/lib/instructor-application/`)

Port from `code-temp/` — single module, no duplication.

| Dataset | URL | Fallback |
|---------|-----|----------|
| Job titles | `https://du-lieu-ho-so.pages.dev/chuc-danh.json` | `mock-job-titles.ts` |
| Companies | `https://du-lieu-ho-so.pages.dev/cong-ty.json` | `mock-companies.ts` |
| Live job search | `https://api.hh.ru/suggests/vacancy_search_keyword?text=` | merge + dedupe |
| Live company | Wikidata `wbsearchentities` + SPARQL | `wikidata-company.ts` port |

`remote-data.ts`: 8s timeout, session cache, fallback on error.

### Required merge semantics (FE-06)

1. **Wikidata + Cloudflare merge** — domain match and alias heuristics, not exact-name only.
2. **Fallback id prefix** — `fallback:` or `local:` (not `remote:local-N`).
3. **Source note by search state** — idle vs searching vs fallback labels.

Company select resolves by **option `id` or index**, never re-resolve by label alone.

---

## Submit UX

- Confirm dialog before submit (SLA 5-day message).
- State C → `POST`; State E/F → `PUT /me`.
- Success toast + refetch `GET /me`.

---

## State H — contact admin

Wire after **BE-10** contract: reuse `POST /instructor-tickets` + message (preferred) or documented alternative. Tab replaces application form when `rejection_count >= 5`.

---

## Related docs

- [`instructor-admin.md`](./instructor-admin.md) — admin approvals enhancements (ADM-01–03)
- [`pages.md`](./pages.md), [`router.md`](./router.md), [`screens.md`](./screens.md)
- [`components.md`](./components.md) — shared UI inventory
- [`modules.md`](./modules.md) — module boundaries
