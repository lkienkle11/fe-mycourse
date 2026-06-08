# Taxonomy admin (FE)

_Last audited: 2026-06-08 (shared Zod schemas, RequiredLabel, code-based API errors)._

Admin and sysadmin dashboards can manage five taxonomy resources aligned with BE `/api/v1/taxonomy/*`:

| Resource | Route (admin) | Route (sysadmin) |
|----------|-----------------|------------------|
| Course levels | `/admin/taxonomy/levels` | `/sysadmin/taxonomy/levels` |
| Topics | `/admin/taxonomy/topics` | `/sysadmin/taxonomy/topics` |
| Outcomes | `/admin/taxonomy/outcomes` | `/sysadmin/taxonomy/outcomes` |
| Skills | `/admin/taxonomy/skills` | `/sysadmin/taxonomy/skills` |
| Tags | `/admin/taxonomy/tags` | `/sysadmin/taxonomy/tags` |

## Screen layer

Taxonomy now follows a slimmer **app route → shared screen** pattern:

| Layer | Path | Role |
|-------|------|------|
| App route | `src/app/[locale]/admin/taxonomy/{resource}/page.tsx` | Imports shared `TaxonomyListPage` directly |
| App route | `src/app/[locale]/sysadmin/taxonomy/{resource}/page.tsx` | Same shared screen for sysadmin |
| Shared screen | `src/screen/common/taxonomy/taxonomy-list-page.tsx` | `TaxonomyListPage` — client CRUD list (DataTable, form dialog, delete confirm) |

Resource keys match `TAXONOMY_RESOURCE_KEYS` in `src/constants/taxonomy/resources.ts` (`levels`, `topics`, `outcomes`, `skills`, `tags`).

## Sidebar navigation

Taxonomy appears under **admin** and **sysadmin** dashboard sidebars (`ADMIN_DASHBOARD_ITEMS` / `SYSADMIN_DASHBOARD_ITEMS` in `src/constants/dashboard/`). Each node has its own Lucide icon via `TAXONOMY_MENU_ICONS` (`src/constants/dashboard/taxonomy-icons.ts`) so admin and sysadmin stay in sync:

| Menu key | Lucide icon | Used for |
|----------|-------------|----------|
| `group` | `Network` | Taxonomy parent (collapsible group) |
| `levels` | `Layers` | Course levels |
| `topics` | `BookMarked` | Topics |
| `outcomes` | `Target` | Outcomes |
| `skills` | `Brain` | Skills |
| `tags` | `Tags` | Tags |

Labels use i18n keys `taxonomy.menu.*` (`titleKey` on `DashboardItem`). Items are deep-filtered by `filterPermissionNavTree` (see `docs/logic-flow.md` §6).

To change icons, edit `taxonomy-icons.ts` only — do not duplicate imports in `admin-items.ts` / `sysadmin-items.ts`.

## Permissions

Sidebar items and actions use RBAC keys from `src/constants/permissions.ts` (e.g. `course_level:read`, `topic:create`). Group visibility uses `TAXONOMY_GROUP_READ_PERMISSIONS` (`src/constants/taxonomy/resources.ts`) with `permissionMode: "any"` on the parent node; each child has its own read permission. Per-resource columns, tree flags, and searchable fields: `TAXONOMY_RESOURCES` + `getTaxonomyResourceConfig()` / `getTaxonomySearchableColumns()` / `countTaxonomyTreeNodes()` (`src/lib/utils/taxonomy.ts`).

## UI copy (i18n)

Taxonomy strings live under `taxonomy.*` in `src/messages/vi.ts` and `en.ts`. User-facing tree labels avoid technical “node” wording:

| Context | Vietnamese | English |
|---------|------------|---------|
| Topics table column `child_render` | Chủ đề con | Sub-topics |
| Skills table column `child_render` | Kỹ năng con | Sub-skills |
| Tree view button / dialog | Xem cây / `{name} — cây` | View tree / `{name} — tree` |
| Shared `dagreTree.*` (layout toggles, empty state) | Dọc, Ngang, … | Vertical, Horizontal, … |
| Topics tree editor | Thêm chủ đề con, Tên chủ đề con, … | Add sub-topic, … |
| Skills tree editor | Thêm kỹ năng con, … | Add sub-skill, … |

## Tree visualization (read-only)

Topics and skills list rows with nested `child_topics` / `children` show a **View tree** button in the `child_render` column. It opens shared `DagreTreeDialog` with `nodesDraggable={false}` (read-only layout; no manual node repositioning). The list row is the graph root; descendants use `@xyflow/react` + `dagre`. Each node shows **name only** (no slug). Layout toggles: vertical (default) or horizontal. Rows with no child nodes show a disabled button with tooltip.

Edit/reorder still uses `SortableTreeEditor` in the form dialog — separate from the read-only dagre popup.

## Drag-and-drop

- **Topics / skills:** nested tree order in the form dialog (`child_topics` / `children`).
- **Outcomes:** paragraph list order in the form dialog (`description[]`).
- **Levels / tags:** table column sort only (no reorder API).

## Image fields

Topics and outcomes support optional `image_file_id` (media file UUID). The form dialog opens **Browse media** (`MediaCollectionDialog` with `visibleTabs={["image"]}` only — no document/video tabs) when the user has `media_file:read`. Selection callback receives both the selected `file` and active-tab `type`; taxonomy accepts only `type === "image"`, then stores `file.id` and shows a thumbnail when picked in-session. On edit, preview also hydrates from API field `image_file_url`. The preview/picker UI is implemented via shared component `ImageFileField` at `src/components/shared/image-file-field.tsx`. See [media-collection.md](./media-collection.md).

## Slug (read-only preview; server authority)

- UI preview uses `slugifyName()` / `generateSlug()` in `src/lib/utils/slug.ts` (trim, lowercase, remove Vietnamese accents, `đ/Đ -> d`, spaces/underscores → `-`, keep Unicode letters/numbers, collapse repeated dashes).
- Slug field is **read-only** on create and edit; users only type the name.
- **Create/update API payloads omit `slug`** — BE derives it from `name` (and from each tree node `name`) via `utils.SlugifyName`.
- Tree nodes: name is editable, slug preview is read-only; write payload omits `slug` on `TaxonomyTreeNode` (use `toTaxonomyTreeWritePayload()` in `src/lib/utils/taxonomy.ts`).

## List query types

`TaxonomyListFilters` extends shared `ApiListQueryParams` with typed-search fields:
- `search_by`: `name | slug | short_description`
- `search_value`: text value used with `search_by`

Query strings are built from shared `apiListQueryToRecord()` plus taxonomy-specific `search_by`/`search_value` keys in `src/api/callers/taxonomy/taxonomy.ts`.

## List toolbar (FilterBy)

Taxonomy list screens now use the built-in `DataTable` toolbar instead of a page-local search/status row:

- `FilterBy` options are derived from table columns and constrained by resource searchable-field config.
- The `status` filter option provides `customInputComponent` directly on its `DataTableFilterByOption`.
- When `FilterBy` points to an option with `customInputComponent` (currently `status`), the default search input is hidden and that custom input is shown (`All statuses`, `Active`, `Inactive`).
- When `FilterBy` is not `status`, the search input + search action are shown.
- Status behavior is unchanged.
- Text search sends `search_by` + `search_value` and resets page to `1`.

## Validation and API errors

- **Schemas**: `src/schema/taxonomy/taxonomy.ts` — `taxonomySlugStatusSchema`, `taxonomyTopicSchema`, `taxonomySkillSchema`, `taxonomyOutcomeSchema` (i18n keys under `taxonomy.form.validation.*`).
- **Form UI**: `TaxonomyFormDialog` uses `RequiredLabel` + `FieldError` on `name` / `short_description`; Zod keys resolve via `useTranslations("taxonomy.form")` + `validation.*`; slug preview stays read-only (`required={false}`).
- **Client checks**: Zod via `zodResolver` before submit; tree/description editors remain separate state (validated on submit through parent schema).
- **API failures**: list delete and form create/update catch → `toastApiError(useTranslations("errors.codes"), error)` — never `taxonomy.common.errorGeneric` for API responses.

## Sample data

Create rows via the admin UI or BE `curl` examples in `be-mycourse/docs/curl_api.md` §12.
