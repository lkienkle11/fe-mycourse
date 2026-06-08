# Media collection (FE)

_Last audited: 2026-06-08 (code-based API errors + `media.validation.*` client checks)._

Reusable media library popup for browsing, uploading, and selecting files. Wired into taxonomy topic/outcome forms for cover images.

## Components

| File | Role |
|------|------|
| `src/components/features/media/media-collection-dialog.tsx` | Main dialog: tabs, filename search, sort, pagination, upload entry |
| `src/components/features/media/media-upload-dialog.tsx` | Nested upload (max 5 files, 2 GiB total) |
| `src/components/features/media/media-item-card.tsx` | Grid card: preview, overflow menu, single-select via full-card overlay `button` (menu stays clickable above overlay), filename tooltip with full text |
| `src/components/features/media/media-tab-panel.tsx` | Grid + loading skeleton + empty state |

Dialog width: `MediaCollectionDialog` uses `max-w-5xl` for a wider browsing surface.

## API layer

| File | Role |
|------|------|
| `src/api/callers/media/media.ts` | `listMediaFiles`, `uploadMediaFiles`, `deleteMediaFile` |
| `src/api/hooks/media/useMediaFiles.ts` | SWR list + `mutate` |
| `src/constants/api-route.ts` | `media.files`, `media.fileById` |
| `src/types/media/index.ts` | `MediaFile`, filters, tab types |
| `src/constants/media/file-rules.ts` | Accept rules, size limits, extension lists, `MEDIA_COLLECTION_ALL_TABS` |
| `src/lib/utils/media.ts` | `isImageFilename`, `getMediaTabExtensions`, `isExecutableExtension`, `validateMediaUploadBatch`, `getMediaDeleteKey`, `isImageMedia` (uses shared `apiListQueryToRecord`) |
| `src/lib/utils/api-error.ts` | `toastApiError` — delete/upload API failures map to `errors.codes.{code}` |
| `src/lib/utils/list-query.ts` | `apiListQueryToRecord()` — `page`, `per_page`, `search`, `sort_by`, `sort_order`, `category` |
| `src/lib/utils/format-bytes.ts` | `formatBytes()` — per-file and total size labels in upload dialog |

## List filters (FE)

`MediaListFilters` extends `ApiListQueryParams` (`src/types/media/index.ts`) with `category` and `sort_order`. Query strings are built with `apiListQueryToRecord()` — same helper as taxonomy (`src/lib/utils/list-query.ts`), not a duplicate `mediaListFiltersToRecord`. The popup applies filename search via `search`.

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

## Visible tabs

`visibleTabs?: readonly MediaTab[]` — subset of `image` | `document` | `video`. Omitted = all three tabs. Tabs not in the list are hidden (no switcher when only one tab remains).

Helpers: `resolveVisibleMediaTabs()`, `resolveMediaCollectionDefaultTab()` in `src/lib/utils/media.ts`. Canonical tab order: `MEDIA_COLLECTION_ALL_TABS` in `src/constants/media/file-rules.ts`.

```tsx
// Full library (default)
<MediaCollectionDialog open={open} onOpenChange={setOpen} />

// Taxonomy cover image — images only
<MediaCollectionDialog
  open={open}
  onOpenChange={setOpen}
  visibleTabs={["image"]}
  defaultTab="image"
  selectionMode="single"
/>
```

## Taxonomy integration

`taxonomy-form-dialog.tsx` passes `visibleTabs={["image"]}` so document/video tabs never appear. `selectionMode="single"`; picker callback receives `type` from active tab and guards `type === "image"` before setting form state. Stored value is `image_file_id` (media row UUID).

Permissions: `media_file:read` (browse), `media_file:create` (upload), `media_file:delete` (card menu).

## Search behavior

- Search input and button are in `MediaCollectionDialog` toolbar.
- Search value is sent as `search` query param to `GET /api/v1/media/files`.
- Search is filename-based and respects active tab category (`image` / `document` / `video`).
- Applying search resets pagination to page 1.

## Display behavior

- Media items in the popup show `file.filename` as the visible label.
- Hovering truncated filename shows a tooltip with the full filename.
- Selection still stores `file.id` (`image_file_id` in taxonomy forms); selection callback also emits tab `type` (`image`/`document`/`video`).

## Accessibility

Radix `DialogContent` requires a description for screen readers:

- `MediaCollectionDialog` and `MediaUploadDialog` render `DialogDescription` with `className="sr-only"` and copy from `media.collection.description` / `media.upload.description`.

`MediaItemCard` with `selectionMode="single"` must not wrap the overflow menu `Button` in the same outer `<button>` (invalid HTML and React hydration error). Pattern:

1. Card root is a `relative` `div`.
2. Full-card `button` (`absolute inset-0 z-0`) handles select + keyboard.
3. Visual content uses `pointer-events-none` so clicks reach the overlay.
4. Menu wrapper uses `pointer-events-auto z-20` so the ⋮ trigger stays interactive.

## Known gaps

- Rename: menu item disabled (“Coming soon”); no BE rename API.
- Edit form preview: existing `image_file_id` shows truncated UUID until user re-picks from library (no GET-by-UUID on FE).

## Validation and API errors

- **Client upload checks**: `validateMediaUploadBatch()` in `src/lib/utils/media.ts` → toast `media.validation.*` (`tooMany`, `fileTooLarge`, `totalTooLarge`, `executableRejected`).
- **API upload/delete failures**: `toastApiError(useTranslations("errors.codes"), error)` — codes `2003`–`2009`, `9010`–`9018`, etc.
- **API errors** use `errors.codes.{code}` only (`2003`–`2009`, `9010`–`9018`, etc.) via `toastApiError`.
- **Client pre-submit** uses `media.validation.*` (`tooMany`, `fileTooLarge`, `totalTooLarge`, `executableRejected`).
- `media.upload.errors.*` is legacy UI copy — not used for API responses.

## i18n

Namespaces in `src/messages/en.ts` and `vi.ts`:

| Namespace | Notable keys |
|-----------|----------------|
| `media.collection.*` | `title`, `description` (sr-only dialog), `tabs.*`, `sort.*`, `add.*`, pagination, delete confirm |
| `media.validation.*` | Client upload limits (`tooMany`, `fileTooLarge`, `totalTooLarge`, `executableRejected`) |
| `media.upload.*` | `title.*`, `description` (sr-only dialog), `dropHint`, `limits`, `success` |
| `media.item.*` | `untitled`, `noPreview`, `rename`, `delete` |
| `media.picker.*` | `browse`, `clear` (taxonomy cover field) |
| `errors.codes.*` | All API failures (shared across modules) |
