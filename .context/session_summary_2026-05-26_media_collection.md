# Session: Media collection popup (2026-05-26)

## Branch / git

- FE: `feat/sysadmin-taxonomy-admin` (clean before work).
- BE: `docs/audit-migration-deploy-sync` (clean before work).

## What was built

Media library popup (FE) + list filter extensions (BE) for taxonomy cover image selection.

### Backend

| Area | Changes |
|------|---------|
| List filter | `sort_by`, `sort_order`, `category` on `FileFilterRequest` / `FileFilter` |
| Repository | `internal/media/infra/list_filter.go` — whitelisted ORDER BY, category SQL |
| Response | `created_at`, `updated_at` on `UploadFileResponse` |
| Docs | `docs/modules/media.md`, `docs/api_swagger.yaml` |

### Frontend

| Area | Paths |
|------|--------|
| Types/constants | `src/types/media/`, `src/constants/media/file-rules.ts` |
| Utils | `src/lib/utils/media.ts` (list queries use shared `apiListQueryToRecord`); `src/lib/utils/format-bytes.ts` (`formatBytes` for upload UI) |
| API | `src/api/callers/media/`, `src/api/hooks/media/useMediaFiles.ts`, `api-route.ts` |
| UI | `src/components/features/media/*` |
| Taxonomy | `taxonomy-form-dialog.tsx` — Browse media picker |
| i18n | `media.*` in `en.ts`, `vi.ts` |
| Docs | `docs/media-collection.md`, updated `taxonomy-admin.md`, `components.md`, `architecture.md` |

### API contract (list)

`GET /api/v1/media/files?page&per_page&category=image|document|video&sort_by&sort_order`

Delete: `DELETE /api/v1/media/files/:object_key`

Upload: `POST` multipart field `files` (max 5, 2 GiB total)

### Verify commands

```bash
# BE
cd be-mycourse
go test ./internal/media/infra/... -run 'TestMediaList|TestBuildDocument|TestImageCategory'
golangci-lint run ./internal/media/...
go build ./...
make check-architecture check-dupl check-layout

# FE
cd fe-mycourse
npm run lint && npm run lint:biome && npm run build
```

### GitNexus

- Pre-edit: `GormFileRepository.List` not indexed by exact name; FE media query returned permission-adjacent flows (LOW).
- Post-work: run `npx gitnexus analyze` in each repo before commit.
