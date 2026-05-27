# Session: FE taxonomy admin (2026-05-26)

## Branch / git

- Branch: `refactor/header-shared-home-navigation` (clean working tree before this work).
- GitNexus `detect_changes`: 29 symbols, 10 files, risk **LOW**.

## What was built

Full admin + sysadmin taxonomy CRUD UI for five BE resources: levels, topics, outcomes, skills, tags.

### Key files

| Area | Paths |
|------|--------|
| Types | `src/types/taxonomy/index.ts` |
| Config | `src/constants/taxonomy/resources.ts`, `src/constants/api-route.ts` |
| API | `src/api/callers/taxonomy/`, `src/api/hooks/taxonomy/useTaxonomy.ts`, `apiPatch` in `src/api/methods.ts` |
| UI | `src/components/features/taxonomy/*`, `src/components/shared/confirm-delete-dialog.tsx` |
| Screen | `src/screen/taxonomy/taxonomy-list-page.tsx` |
| Routes | `src/app/[locale]/admin/taxonomy/*/page.tsx` ×5, `sysadmin/taxonomy/*/page.tsx` ×5 |
| Menus | `admin-items.ts`, `sysadmin-items.ts` + `DashboardItem.titleKey` + sidebar i18n |
| i18n | `taxonomy.*`, `dashboard.taxonomy.menu.*` in `en.ts` / `vi.ts` |
| Docs | `docs/taxonomy-admin.md` |
| Shared list query | `ApiListQueryParams`, `apiListQueryToRecord`, `TaxonomyListFilters` alias |
| Slug UX | Read-only from name via `generateSlug()` / `slugifyName()` (Vietnamese-normalized, Unicode-safe) |

### API endpoints

- `GET/POST /api/v1/taxonomy/{levels|topics|outcomes|skills|tags}`
- `PATCH/DELETE /api/v1/taxonomy/{segment}/:id`

### DnD scope

- **Topics/skills:** `TaxonomyTreeEditor` in form dialog (`child_topics` / `children`).
- **Outcomes:** `TaxonomyDescriptionEditor` (≤8 paragraphs).
- **Levels/tags:** table column sort only.

### Known gaps

- No media upload picker — optional `image_file_id` UUID text field on topics/outcomes.

### Verify commands

```bash
cd fe-mycourse
npm run lint && npm run lint:biome && npm run build
npx gitnexus analyze   # already up to date after session
```

### GitNexus (pre-edit)

- `filterDashboardItems` impact: LOW (callers: `useFilteredDashboardItems`, `DashboardLayout`).
