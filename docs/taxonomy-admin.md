# Taxonomy admin (FE)

_Last audited: 2026-05-27 (taxonomy admin/sysadmin verified vs src)._

Admin and sysadmin dashboards can manage five taxonomy resources aligned with BE `/api/v1/taxonomy/*`:

| Resource | Route (admin) | Route (sysadmin) |
|----------|-----------------|------------------|
| Course levels | `/admin/taxonomy/levels` | `/sysadmin/taxonomy/levels` |
| Topics | `/admin/taxonomy/topics` | `/sysadmin/taxonomy/topics` |
| Outcomes | `/admin/taxonomy/outcomes` | `/sysadmin/taxonomy/outcomes` |
| Skills | `/admin/taxonomy/skills` | `/sysadmin/taxonomy/skills` |
| Tags | `/admin/taxonomy/tags` | `/sysadmin/taxonomy/tags` |

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

Sidebar items and actions use RBAC keys from `src/constants/permissions.ts` (e.g. `course_level:read`, `topic:create`). Group visibility uses `TAXONOMY_GROUP_READ_PERMISSIONS` with `permissionMode: "any"` on the parent node; each child has its own read permission.

## UI copy (i18n)

Taxonomy strings live under `taxonomy.*` in `src/messages/vi.ts` and `en.ts`. User-facing tree labels avoid technical “node” wording:

| Context | Vietnamese | English |
|---------|------------|---------|
| Topics table column `child_count` | Chủ đề con | Sub-topics |
| Skills table column `child_count` | Kỹ năng con | Sub-skills |
| Topics tree editor | Thêm chủ đề con, Tên chủ đề con, … | Add sub-topic, … |
| Skills tree editor | Thêm kỹ năng con, … | Add sub-skill, … |

## Drag-and-drop

- **Topics / skills:** nested tree order in the form dialog (`child_topics` / `children`).
- **Outcomes:** paragraph list order in the form dialog (`description[]`).
- **Levels / tags:** table column sort only (no reorder API).

## Image fields

Topics and outcomes support optional `image_file_id` (media file UUID). The form dialog opens **Browse media** (`MediaCollectionDialog` with `visibleTabs={["image"]}` only — no document/video tabs) when the user has `media_file:read`. Selection stores the file `id` and shows a thumbnail when picked in-session. See [media-collection.md](./media-collection.md).

## Slug (read-only)

- Computed from **Name** via `slugifyName()` in `src/lib/utils/slug.ts` (spaces become `-`, e.g. `36 Thanh Hóa` → `36-thanh-hoa`).
- Slug field is **read-only** on create and edit; users only type the name.
- Tree nodes: name is editable, slug preview is read-only and updated when the name changes.

## List query types

`TaxonomyListFilters` is a type alias of `ApiListQueryParams` (`src/types/api.ts`). Query strings are built with `apiListQueryToRecord()` (`src/lib/utils/list-query.ts`).

## Sample data

Create rows via the admin UI or BE `curl` examples in `be-mycourse/docs/curl_api.md` §12.
