# Session: Taxonomy typed search rebuild (FE)

**Date:** 2026-05-28

## Why this rebuild

- Previous FE implementation was rejected and discarded.
- Rebuilt with strict reuse of existing types/utilities.

## Reuse-first implementation

- Kept shared list-query helper usage:
  - `src/lib/utils/list-query.ts` -> `apiListQueryToRecord`
- Kept shared base list type as foundation:
  - `TaxonomyListFilters` now **extends** `ApiListQueryParams` (not replaced).
- Taxonomy caller appends only taxonomy-specific keys (`search_by`, `search_value`) after shared conversion.
- No full duplicate taxonomy query-mapper introduced.

## Contract changes

- Taxonomy list requests now send strict `search_by` + `search_value` for text search.
- Status behavior remains unchanged.
- Searchable fields:
  - levels/topics/skills/tags: `name`, `slug`
  - outcomes: `short_description`

## Code changes

- `src/types/taxonomy/index.ts`
  - `TaxonomySearchBy` + `TaxonomyListFilters` extension
- `src/api/callers/taxonomy/taxonomy.ts`
  - Reuse `apiListQueryToRecord` + append taxonomy typed-search fields
- `src/constants/taxonomy/resources.ts`
  - Added reusable searchable-field mapping helper
- `src/screen/taxonomy/taxonomy-list-page.tsx`
  - FilterBy now constrained to searchable fields + status
  - Search submits `search_by` / `search_value`

## Docs synchronized

- `docs/taxonomy-admin.md`
- `docs/api-using.md`
- `docs/modules.md`
- `docs/folder-structure.md`
- `docs/patterns.md`
- `docs/reusable-assets.md`

## Verification

- `npm run lint:biome` ✅ (existing warning in `src/components/ui/sidebar.tsx`)
- `npm run lint` ✅ (existing warnings in generated `.jscpd-report/html/js/prism.js`)
- `npm run test` ❌ (no `test` script in package.json)
- `npm run build` ✅
- `npm run quality:deps` ✅

## GitNexus

- Reindexed before and after edits with `npx gitnexus analyze --force`.
- Symbol impact before edits:
  - `TaxonomyListPage`: LOW
  - `apiListQueryToRecord`: LOW
  - `ApiListQueryParams`: HIGH (avoided direct edits to this symbol)
