# Session: Course basic info save fix

## Problem
`Lưu thông tin cơ bản` on `/instructor/courses/:id/info` did not call `PATCH /api/v1/courses/:id/basic-info`.

## Root cause
- New `course_versions` rows were inserted with `row_version = 0` (GORM zero value overrides DB `DEFAULT 1`).
- FE `courseBasicInfoSchema` requires `expected_row_version >= 1`.
- Zod validation failed silently on submit (no `toastValidationError` handler on basic-info form).

## Fix
### BE (`be-mycourse`)
- Set `RowVersion: 1` in `CreateCourse` and `createDraftVersion`.
- Migration `000020_course_version_row_version_backfill` updates legacy `row_version = 0` rows to `1`.

### FE (`fe-mycourse`)
- `course-editor-basic-tab.tsx`: add `toastValidationError` on invalid `handleSubmit`.

## Verify
- DB course 6: `row_version` backfilled to `1`.
- API smoke: `PATCH /api/v1/courses/6/basic-info` with `expected_row_version: 1` succeeds.
- FE quality: `lint:biome`, `lint`, `build`, `quality:deps` pass.
- BE quality: `go build`, `go test`, `make check-layout`, `check-dupl`, `check-architecture` pass.

## Docs updated
- BE: `migrations/README.md`, `docs/database.md`, `docs/modules/course.md`, `docs/api-dog-import.json`
- FE: `docs/components.md`, `docs/modules.md`

## Deploy note
Run migration on each environment: `MIGRATE=1 go run .` (or equivalent) so `000020` applies before instructors edit legacy drafts.
