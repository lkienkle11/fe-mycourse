# Session Summary — UUID v7 Migration (FE G1–G3)

**Date:** 2026-06-09  
**Scope:** `fe-mycourse` — discovery + implementation + close-out

## G1 Discovery — file list (canonical)

| File | Change |
|------|--------|
| `src/types/auth/auth.ts` | `user_id: string` |
| `src/types/course.ts` | All entity/FK IDs → `string`; arrays `tag_ids`/`skill_ids`/`outcome_ids` → `string[]` |
| `src/types/instructor.ts` | Application/expertise/ticket IDs → `string` |
| `src/types/taxonomy/index.ts` | Taxonomy row IDs → `string` |
| `src/api/callers/course/course.ts` | Path/body ID params → `string` |
| `src/api/callers/instructor/instructor.ts` | Same |
| `src/api/callers/taxonomy/taxonomy.ts` | Same |
| `src/api/hooks/course/useCourses.ts` | ID types |
| `src/api/hooks/instructor/*.ts` | ID types |
| `src/schema/course/course.ts`, `src/schema/instructor/instructor.ts` | Zod UUID strings |
| `src/lib/utils/course.ts` | Remove `Number()` on level/topic IDs |
| `src/lib/utils/taxonomy.ts` | `newV7()` for tree node IDs |
| `src/lib/utils/uuid.ts` | **New** — `newV7()` via `uuid` package |
| Components/screens | Editor route, expertise page, basic tab, dialogs, data-table, review/editor pages |

**Reuse:** extended existing types/callers; no parallel ID helper besides `src/lib/utils/uuid.ts`.

## G2 Implementation
- Removed `Number()` / `parseInt()` on entity IDs in course/instructor flows.
- Client-generated entity IDs use `newV7()` (quiz option_key, taxonomy tree nodes).
- `crypto.randomUUID()` kept only for non-entity correlation (e.g. api-error-store).

## G3 Quality gates

| Gate | Result |
|------|--------|
| `npm run lint:biome` | PASS (403 files) |
| `npm run build` | PASS |
| `npm run quality:deps` | PASS (cycles + dupl) |

## Dependency
- Added `uuid` to `package.json` for v7 generation.

## Manual verify
- Build compiles all routes including course editor, instructor expertise, taxonomy admin.
- E2E against dev API recommended after BE DB restore.
