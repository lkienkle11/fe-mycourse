# Media collection (FE)

_Last audited: 2026-07-22 — `uploadMediaFiles` uses authenticated transport with **30s** per-request timeout (default API timeout remains 10s). Prior: backend-scoped list; `visibility` on upload; R2 keys `{user_code}/…`._

Reusable media library popup for browsing, uploading, and selecting files. Wired into taxonomy topic/outcome forms, course editor, instructor application (CV/certificate/video), and Quill embeds.

## Components

| File | Role |
|------|------|
| `src/components/features/media/media-collection-dialog.tsx` | Main dialog: tabs, filename search, sort, pagination, upload entry; optional `uploadAllowedExtensions` narrows upload `accept` + client validation (e.g. PDF-only CV picker) |
| `src/components/features/media/media-upload-dialog.tsx` | Nested upload (max 5 files, 2 GiB total) |
| `src/components/features/media/media-item-card.tsx` | Grid card: preview, **public badge + uploader `display_name`**, overflow menu, single-select via full-card overlay `button` |
| `src/components/features/media/media-tab-panel.tsx` | Grid + loading skeleton + empty state |

Dialog width: `MediaCollectionDialog` uses `max-w-5xl` for a wider browsing surface.

## API layer

| File | Role |
|------|------|
| `src/api/callers/media/media-factory.ts (+ media-browser.ts)` | `listMediaFiles`, `uploadMediaFiles` (default `visibility=private`; **30s** `timeout` on multipart POST), `deleteMediaFile` |
| `src/api/hooks/media/useMediaFiles.ts` | SWR list + `mutate` |
| `src/constants/api-route.ts` | `media.files`, `media.fileById` |
| `src/types/media/index.ts` | `MediaFile`, filters, tab types; `visibility?: "private" \| "public"`; uploader `display_name?` only |
| `src/constants/media/file-rules.ts` | Accept rules, size limits, extension lists, `MEDIA_COLLECTION_ALL_TABS` |
| `src/lib/utils/media.ts` | `isImageFilename`, `getMediaTabExtensions`, `validateMediaUploadBatch`, `getMediaDeleteKey`, `isImageMedia` |
| `src/lib/utils/api-error.ts` | `toastApiError` — delete/upload API failures map to `errors.codes.{code}` |
| `src/lib/utils/list-query.ts` | `apiListQueryToRecord()` — pagination/search/sort/category (no client-side visibility filter) |
| `src/lib/utils/format-bytes.ts` | `formatBytes()` — upload dialog size labels |

## Backend list scoping (no FE filter param)

`GET /api/v1/media/files` returns only rows the caller may pick:

- Own files (any visibility)
- Other users' **`public`** files

Legacy rows with NULL `user_id` (pre-owner backfill) **do not appear** in the popup. Private files owned by someone else **never** appear. FE does not filter client-side — it displays whatever the API returns.

## BE list query params

`GET /api/v1/media/files` supports:

| Param | Values |
|-------|--------|
| `page`, `per_page` | Pagination |
| `search` | filename contains (case-insensitive) |
| `category` | `image`, `document`, `video` |
| `sort_by` | `created_at`, `updated_at`, `filename`, `size_bytes` |
| `sort_order` | `asc`, `desc` |

Delete uses **object key**: `DELETE /api/v1/media/files/:object_key`.

## Upload defaults

`POST /api/v1/media/files` multipart:

- `files` — 1–5 parts
- `visibility` — optional; FE sends **`private`** when omitted. **`public`** makes the file selectable by all users in the media popup.

New R2 objects use object keys `{user_code}/{8digits}-{filename}` (server-side from JWT).

## Permissions

| Permission | ID | Used in UI |
|------------|-----|------------|
| `media_file:read` | P26 | Browse library (callers open dialog when user has read) |
| `media_file:create` | P27 | Upload button, delta-editor paste/drop |
| `media_file:update` | P28 | Reserved (rename / visibility toggle not wired yet) |
| `media_file:delete` | P29 | Card overflow delete |

**Instructor** and **learner** roles receive P26–P29 via `roles_permission.go` (sync on BE — no migration). Until sync, upload/browse may 403.

## Visible tabs

`visibleTabs?: readonly MediaTab[]` — subset of `image` | `document` | `video`. Omitted = all three tabs.

## Display behavior

- Every card uses `file.filename` as the primary label and keeps it emphasized.
- Image and video cards show the normal preview surface when available.
- If preview is unavailable for a non-image and non-video file, the card shows the no-preview state without duplicating the filename below it with lighter styling.
- If preview is unavailable for an image or video file, the card shows the no-preview title together with the filename underneath.
- The no-preview filename is clamped to **2 lines**; longer text is truncated with an ellipsis and remains visible.
- **`visibility === "public"`** shows a small **Public** badge (`media.item.publicBadge`) and the uploader **`display_name`** on the card (muted text below the badge; omitted when BE returns an empty name).
- Selection stores `file.id`; delete uses `file.object_key`.

## Validation and API errors

- **Client upload checks**: `validateMediaUploadBatch()` → toast `media.validation.*`
- **API failures**: `toastApiError` → `errors.codes.*` (including `3003` Forbidden when accessing another user's private file)

## i18n

| Namespace | Notable keys |
|-----------|----------------|
| `media.collection.*` | Dialog chrome, tabs, sort, pagination |
| `media.item.*` | `publicBadge`, `untitled`, `delete` |
| `media.validation.*` | Client upload limits |
| `media.upload.*` | Upload dialog copy |

## Known gaps

- Rename menu item disabled; no BE rename API.
- Visibility toggle in UI (public ↔ private after upload) not implemented — upload defaults to private only.
- Legacy R2 key repath / `user_id` backfill on old rows — planned separately on BE.
