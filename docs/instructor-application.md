# Instructor application page (user)

_Last audited: 2026-07-06 — Wikidata filter: allow video-game **companies** (developer/publisher/studio); block game **titles** only; `allSettled` vi/en fetch; merge prefers description-passing locale (Riot Games). Prior: prefix-match + token suffix for Samsung/PayPal._

Public authenticated page for learners to submit and manage their **instructor application**. Admin review UX remains in [`instructor-admin.md`](./instructor-admin.md).

**BE contract:** `be-mycourse/docs/modules/instructor.md`, `be-mycourse/docs/api_swagger.yaml`

---

## Route

| URL | App route | Screen |
|-----|-----------|--------|
| `/{locale}/become-instructor` | `src/app/[locale]/(web)/become-instructor/page.tsx` | `BecomeInstructorPage` (`src/screen/common/instructor/become-instructor-page.tsx`) |

- Layout: `(web)` — site `Header` + `Footer` (same as home).
- Route constant: `PUBLIC_ROUTES.becomeInstructor` → `"/become-instructor"` in `src/constants/route.ts`.

### Site-wide promo banner (learner users)

`BecomeInstructorPromoBanner` (`src/components/common/header/become-instructor-promo-banner.tsx`) mounts in `(web)/layout.tsx` **above** `Header`.

| Concern | Behaviour |
|---------|-----------|
| Visibility | Logged-in **learner-only** users (`isLearnerUser` in `src/lib/utils/permission.ts`: **P45** present, **P38**/**P39**/**P40** absent). Hidden for guests and elevated roles. **Not shown on `PUBLIC_ROUTES.becomeInstructor`** — learner is already on the apply page. |
| Layout | `fixed top-0 z-20` promo layer unchanged; adds an in-flow **spacer** (`BECOME_INSTRUCTOR_PROMO_BANNER_HEIGHT_PX`) so `Header` and page `<main>` shift down in document flow. Sets `--site-promo-banner-height` so `Header` `sticky top-[var(--site-promo-banner-height,0px)]` sticks below the banner when scrolling. |
| CTA | Link to `PUBLIC_ROUTES.becomeInstructor` — i18n `commonHeader.promoBanner.message` / `commonHeader.promoBanner.cta`. |
| Dismiss | `localStorage` key `mycourse:become_instructor_banner_dismissed` via `src/lib/become-instructor-banner/dismiss-storage.ts`; per-browser until key removed. |

---

## Module layout (`src/lib/instructor-application/`)

Feature logic lives under one namespace; components only render UI.

| File / folder | Responsibility |
|---------------|----------------|
| `get-page-state.ts` | Page state resolver (semantic names) |
| `page-state.ts` | `InstructorApplicationPageState` type + re-export `INSTRUCTOR_PAGE_STATE` |
| `form-state.ts` | Form model, prefill from `GET /me`, submit payload mapper |
| `validate-application-form.ts` | Zod validate + map issues → inline field error keys |
| `url-validation.ts` | Shared HTTP URL helpers + LinkedIn/GitHub host checks (used by Zod schema) |
| `search-text.ts` | Shared normalize/search/slug helpers for combobox + remote datasets |
| `helpers.ts` | `resolveInstructorApplicationProfile`, `resolveInstructorDisplayName`, taxonomy chip labels |
| `types.ts` | Combobox / company-search UI types only |
| `remote-data.ts` | Cloudflare JSON datasets + session cache |
| `combobox.ts` | Job/company suggest merge + **query cache** |
| `wikidata-company.ts` | Wikidata search port |
| `mock-*.ts` | Offline fallbacks |

**Constants:** `src/constants/instructor-application.ts` — `YEAR_EXPERIENCE_BUCKETS`, page-state type.

**API/domain types:** `src/types/instructor.ts` — single source for `YearsExperienceCode`, `MyInstructorApplication`, payloads.

**UI:** `src/components/features/instructor/become-instructor-application/` — `application-form`, `sections`, `panels`, `combobox-fields`, `taxonomy-select`, `taxonomy-section`, `certificate-list`; render only.

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

1. Professional summary — `current_job_title` / `current_company` comboboxes, `years_of_experience` segmented control. **No `headline` field** (not collected on become-instructor; API receives empty `headline` for backward compatibility).
2. About you — **`bio` required** (`Textarea`, 100–2000 characters, live counter). Prefilled from `latest_submission.profile.bio` on resubmit.
3. Documents & links — `cv_file_id` **PDF only**; optional `linkedin_url` (valid **http(s) URL** on **linkedin.com**), `github_url` (valid **http(s) URL** on **github.com**), `portfolio_links` ≤5 (each non-empty entry must be a valid **http(s) URL**). Validated on FE (`instructorApplicationSubmitSchema` + `src/lib/instructor-application/url-validation.ts`) and BE (`validateSubmitInput` / `internal/shared/utils/http_url.go`).
4. Certificates (≤10) — optional collapsible; each row: title, issuer, year, credential URL **or** (label `hoặc` + line break + **Chứng chỉ PDF**) `certificate_file_id` via `MediaCollectionDialog` (`uploadAllowedExtensions` PDF). BE requires **either** non-empty `credential_url` **or** `certificate_file_id` (`application/pdf`, **READY**) per saved certificate row. **Duplicate certificate rows are rejected** on both FE (`instructorApplicationSubmitSchema` `.superRefine`) and BE (`ErrDuplicateCertificate`, dedicated API code `2010` `DuplicateCertificate`): two rows collide when they share the same non-empty `certificate_file_id` (trim), the same non-empty trimmed `credential_url`, or the same normalized `title | issuer | issued_year` composite (case-insensitive, internal whitespace collapsed — `"AWS"` matches `"aws"`, `"AWS  Certified"` matches `"AWS Certified"`). The `.superRefine` flags **both** colliding rows (not only the second) with the inline `validation.certDuplicate` message under each row card; issues use **relative** Zod paths `[index]` inside the array `.superRefine` so `mapZodIssuesToFieldErrors` resolves them to `certificates.{index}` (never `certificates.certificates.{index}`). **Section 4 collapsible UX:** `CollapsibleSection` accepts `expandOnError`; resolved open state is `userOpen || expandOnError` (no remount `key`, no effect-driven `setState`) so the section stays expanded after PDF pickers close when the user had opened it manually, and auto-expands while certificate inline errors exist. Editing **any** certificate field re-runs `refreshCertificateFieldErrors` for the whole certificate section so stale duplicate errors clear on the sibling row when the user resolves the collision. BE returns code `2010` so non-form API clients (e.g. admin profile upsert) get a specific duplicate-certificate error instead of the generic `3001` bad-request code.
5. Intro video (`intro_video_file_id`, `visibleTabs={["video"]}`) — optional collapsible
6. Expertise (`topic_ids` 1–5, `skill_ids` 1–15) — `TaxonomySelect` in `taxonomy-select.tsx` wraps shared `SearchableSelect` with `grid w-full` + `triggerClassName="w-full min-w-0"` so pickers span the section width. Section title has **no trailing question mark** (e.g. Vietnamese: 「Bạn có thể dạy gì」). Selected topic/skill chips show the **localized taxonomy name**, never the raw UUID: labels are cached when the user picks from the dropdown (`taxonomy-section.tsx`) and prefilled from `application.topics` / `application.skills` via `resolveApplicationTaxonomyLabels()` in `helpers.ts`. Taxonomy list calls for the pickers pass **`locale`** from `useLocale()` so BE resolves translation-backed names. **Do not** change `src/components/shared/searchable-select.tsx` (also used by `instructor-expertise-page.tsx` with fixed `w-[280px]` / `max-w-md`).

**Sidebar required checklist (no headline):** bio (≥100 chars), job title + company, years of experience, CV (PDF), ≥1 topic, ≥1 skill.

**Admin profiles list:** removed — approved instructor profiles are viewed from **Roster** via **Xem hồ sơ** modal (`portfolioId` on roster URL). **Profile view dialog** field label: **Current job title** / **Chức danh hiện tại** (`instructor.profileView.currentJobTitle`).

**Certificate form errors:** deleting a certificate row re-runs client validation for certificate rows only (`refreshCertificateFieldErrors` in `validate-application-form.ts`) so remaining invalid rows keep their inline errors; editing any certificate field re-runs validation for the whole certificate section via `refreshCertificateFieldErrors`. Certificate section auto-expands via `expandOnError` when any `certificates.{index}` key is present in `fieldErrors` and remains expanded after errors are resolved.

**Remote lookup helpers:** shared normalize/search utilities in `src/lib/instructor-application/search-text.ts` (used by `combobox.ts`, `remote-data.ts`, `wikidata-company.ts`). Unused `getRemoteDatasetSources` removed.

**`SearchableSelect` consumers (do not break):**

| File | Usage | Width |
|------|-------|-------|
| `become-instructor-application/taxonomy-select.tsx` | Section 6 topic/skill pickers | Full section width |
| `instructor-expertise-page.tsx` | Instructor + topic/skill add pickers | `max-w-md` / `w-[280px]` |

---

## API layer

| Action | Method | Path |
|--------|--------|------|
| Bootstrap / prefill | GET | `/api/v1/instructor-applications/me?locale=` — P45; FE must include route locale in URL **and** SWR key |
| First submit (`ready_to_apply`) | POST | `/api/v1/instructor-applications?locale=` — P45; pass locale so response chips match UI language when mutated with `revalidate: false` |
| Resubmit (`returned_for_revision` / `rejected_can_resubmit`) | PUT | `/api/v1/instructor-applications/me?locale=` — P45; same locale on response hydrate |
| State H contact | POST | `/api/v1/instructor-applications/contact-admin` — P45 + server `rejection_count >= 5`; response `{ ticket_id, status }` |
| Permission gate | GET | `/api/v1/me/permissions` |
| Taxonomy pickers | GET | `/api/v1/taxonomy/topics`, `/api/v1/taxonomy/skills` (include `locale` from `useLocale()`) |

**FE files:** `src/api/callers/instructor/instructor.ts`, `src/hooks/instructor/use-my-instructor-application.ts`, `src/types/instructor.ts`, `src/schema/instructor/instructor.ts`, i18n `instructor.application.*`.

### Data fetching (`useMyInstructorApplication`)

Hook: `src/hooks/instructor/use-my-instructor-application.ts`.

| Concern | Behaviour |
|---------|-----------|
| SWR key | `GET /api/v1/instructor-applications/me?locale=<route>` when logged in (`useLocale()`); `null` when logged out — key **must** change with route locale so chips revalidate |
| Focus revalidation | **Off** — inherits global `revalidateOnFocus: false` from `AppProviders` (do not opt into focus refetch; it caused full-page spinner flashes when returning to the tab) |
| Error retry | `shouldRetryOnError: false` — no automatic retry loop on BE failure |
| `isLoading` | **Bootstrap only** — `true` while auth is still resolving **or** while the first application fetch has not settled (`application === undefined` and no `error`). Background revalidation must **not** flip `isLoading` back to `true` when cached data exists |
| Page shell | `BecomeInstructorPage` shows the centered spinner only when hook `isLoading` is `true` (initial load). After bootstrap, the form stays mounted during silent refetch |

Manual refresh: call `mutate()` after submit, resubmit, or contact-admin — not on tab focus.

**Vietnamese copy (`vi.ts` → `instructor.application`):** job-title field labels use **「Vai trò hiện tại」** — `form.jobTitle`, `form.jobTitlePlaceholder`, `sidebar.req2`. Validation messages under `instructor.validation` use 「vai trò」. **Profile view dialog** field: **「Chức danh hiện tại」** (`profileView.currentJobTitle`) — avoids confusion with system role/permission.

---

## Remote combobox data

Port from `code-temp/` — HTTP via **`rawFetch`** from `src/api/raw-http.ts` (timeout, signal) for third-party URLs. Privacy: user queries are sent from the browser to HH.ru / Wikidata / Cloudflare static JSON.

| Dataset | URL | Fallback |
|---------|-----|----------|
| Job titles | `https://du-lieu-ho-so.pages.dev/chuc-danh.json` | `mock-job-titles.ts` |
| Companies | `https://du-lieu-ho-so.pages.dev/cong-ty.json` | `mock-companies.ts` |
| Live job search | `https://api.hh.ru/suggests/vacancy_search_keyword?text=` | merge + dedupe |
| Live company | Wikidata `wbsearchentities` + SPARQL | `wikidata-company.ts` |

**Wikidata company search filtering** (`wikidata-company.ts`):

1. `wbsearchentities` (vi + en via `Promise.allSettled` — one locale failing does not abort the other; merged, deduped by QID).
2. **Pre-SPARQL text filter** on each hit (before type SPARQL):
   - **Description denylist** — drop persons, disambiguation, music/songs/albums, Wikinews, software libraries, stadiums, communes, bands, YouTubers, documentaries, awards, payment-method products, informal groups, browser extensions, etc. **Video games:** block descriptions that name a **game title** (e.g. `2016 video game`); **allow** game **companies** (`video game developer`, `publisher`, `studio`, `company` — e.g. **Riot Games**).
   - **Label relevance** — `normalizeDedupeKey` compare: exact label = best; label **starts with** query allowed unless a **remainder token** hits the suffix denylist (`mafia`, `park`, `honey`, `holdings`, `galaxy`, `branch`, `sdk`, `credit`, …) — matched by whole tokens, not substring (avoids blocking `Samsung Electronics`). Weak substring-only labels rejected. **Prefix matches are kept** even when an exact label also exists (e.g. query `samsung` → Samsung Electronics, Samsung Group). **Merged vi/en hits:** when the same QID appears in both locales, prefer the variant that passes the description filter, then higher label relevance (`Samsung Group` over `Tập đoàn Samsung`; English `Riot Games` when vi search fails).
   - **Alias matches** (`match.type === "alias"`) — kept only when the **label** also has strong relevance (exact label match). Alias-only hits like “Bill Me Later” (alias “PayPal Credit”) are dropped for query `paypal`.
3. **SPARQL type filter** — instance-of / subclass-of company-like types (business, enterprise, corporation, university, …).
4. **Enrichment SPARQL** — official website (domain) + headquarters label.
5. **Score + sort** — exact label, domain, location, description, search rank; **dedupe by normalized label** (keep highest score).

**Session caches:**

- Dataset load cache in `remote-data.ts` (full JSON once per session).
- **Query cache** in `combobox.ts` — keyed by normalized query string; repeated focus/type with same query does not re-hit third-party APIs.

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

Admin CV / certificate preview uses `src/components/shared/preview-pdf.tsx` — thin wrapper around **`@react-pdf-viewer/core`** + **`@react-pdf-viewer/default-layout`** (toolbar, zoom, sidebar). The heavy viewer lives in `src/components/shared/preview-pdf-viewer.tsx` and is loaded with **`next/dynamic` + `ssr: false`** so `pdfjs-dist` is not evaluated during Turbopack SSR/production bundling.

**Build stub:** `next.config.ts` maps optional Node dependency `canvas` (pulled in by `pdfjs-dist` for server-side rendering paths) to `src/lib/stubs/canvas.ts`. The browser viewer uses the PDF.js worker + DOM canvas only; the stub is never called at runtime.

**Worker URL:** No `public/` copy and no `postinstall` script. Default: **jsDelivr CDN** — `resolvePdfWorkerUrl()` in `src/lib/pdf-worker-url.ts` reads the installed **`pdfjs-dist` version from root `package.json`** (`dependencies.pdfjs-dist`) and builds `https://cdn.jsdelivr.net/npm/pdfjs-dist@{version}/build/pdf.worker.min.js`. Optional override: `NEXT_PUBLIC_PDF_WORKER_URL` (your cloud URL; HTTPS, CORS). Do **not** use Turbopack `?url` imports for the worker — they resolve to `[object Object]` under locale-prefixed routes.

**Hooks:** `defaultLayoutPlugin()` at the **top level** of inner `PreviewPdfViewer`, not inside `useMemo`.

---

## Submit UX

1. User clicks **Nộp đơn đăng ký** / **Gửi lại đơn**.
2. **Client validation first** — `instructorApplicationSubmitSchema` on `toSubmitPayload(form)` via `validateApplicationForm()` in `src/lib/instructor-application/validate-application-form.ts`. On failure: **no confirm modal**; invalid fields show **inline** red border + `text-destructive` message under the control (not toast-only). Errors clear when the user edits that field.
3. On success → `ConfirmActionDialog` (reminder to double-check all information).
4. Confirm → `POST` (`ready_to_apply`) or `PUT /me` (resubmit states).
5. Success toast + refetch `GET /me`.

**Inline error field keys** (Zod path → UI anchor): `current_job_title` (includes `current_job_title_id`), `current_company`, `bio`, `cv_file_id`, `linkedin_url` (`validation.url` or `validation.linkedinUrl`), `github_url` (`validation.url` or `validation.githubUrl`), `portfolio_links` (`validation.url`), `topic_ids`, `skill_ids`, `certificates.{index}` (certificate rows — `validation.certProof` for missing proof, `validation.certDuplicate` for a row that collides with another row). The duplicate check flags **both** colliding rows; editing any certificate field re-runs `refreshCertificateFieldErrors` for the whole section so the sibling row's stale `certDuplicate` error clears when the collision is resolved. Certificate section uses `expandOnError={hasCertificateErrors}` on `CollapsibleSection` (no remount `key`) so inline errors remain visible after PDF pickers close.

**Link validation rules:** empty optional fields pass. Non-empty values must parse as `http:`/`https:` URLs. LinkedIn/GitHub fields additionally require host `linkedin.com` (incl. subdomains) or `github.com` (incl. subdomains) respectively. Portfolio array rejects invalid URLs on any non-blank row.

**i18n:** messages resolved from `instructor.validation.*` (Zod stores `validation.{key}` in issue messages).

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
