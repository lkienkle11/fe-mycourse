# Taxonomy admin (FE)

_Last audited: 2026-07-12 (multilingual: `locale` query, `view=edit`, translation tabs, `expected_row_version`)._

Admin and sysadmin dashboards can manage five taxonomy resources aligned with BE `/api/v1/taxonomy/*`:

| Resource | Route (admin) | Route (sysadmin) |
|----------|-----------------|------------------|
| Course levels | `/admin/taxonomy/levels` | `/sysadmin/taxonomy/levels` |
| Topics | `/admin/taxonomy/topics` | `/sysadmin/taxonomy/topics` |
| Outcomes | `/admin/taxonomy/outcomes` | `/sysadmin/taxonomy/outcomes` |
| Skills | `/admin/taxonomy/skills` | `/sysadmin/taxonomy/skills` |
| Tags | `/admin/taxonomy/tags` | `/sysadmin/taxonomy/tags` |

## REUSE MAP (do not invent)

| Need | Reuse | Do not |
|------|-------|--------|
| UI route locale | `useLocale()` from `next-intl` → pass as API `locale` query | Hard-code `"en"` / invent a second locale source |
| Translation tab languages | Preset list in `CONTENT_LOCALE_OPTIONS` (`src/lib/utils/taxonomy/form-helpers.ts`): UI chrome `en`/`vi` plus common BCP47 presets (`en-US`, `pt-BR`, `fr`, `ja`, …). Add-locale is **dropdown/combobox only** — search filters presets; **no free-enter** of arbitrary/invalid codes | Add `messages/ja.ts` or `ja` to `src/i18n/routing.ts`; free-enter arbitrary BCP47; invent country→locale mapping as the only picker |
| Stale optimistic lock | Course pattern: send `expected_row_version`; on **409** / app code **3005** → `toastApiError` | Invent `expected_updated_at` |
| Edit payload | `getTaxonomyDetailService(resource, id, { view: "edit" })` | Treat list-row `initialData` as full translations SoT |
| List labels | `listTaxonomyService` / `useTaxonomyList` with `locale` | Assume mono-locale canonical `name` only |

UI chrome locales remain **`en` / `vi` only** (no Japanese routing). Stored content locales are free-form BCP47 on the BE write path.

## Screen layer

Taxonomy follows a slimmer **app route → shared screen** pattern:

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

Sidebar items and actions use RBAC keys from `src/constants/permissions.ts` (e.g. `course_level:read`, `topic:create`). Group visibility uses `TAXONOMY_GROUP_READ_PERMISSIONS` (`src/constants/taxonomy/resources.ts`) with `permissionMode: "any"` on the parent node; each child has its own read permission. Per-resource columns, tree flags, and searchable fields: `TAXONOMY_RESOURCES` + `getTaxonomyResourceConfig()` / `getTaxonomySearchableColumns()` / `countTaxonomyTreeNodes()` (`src/lib/utils/taxonomy/`).

## UI copy (i18n) vs data locale

- **UI chrome:** `taxonomy.*` keys in `src/messages/vi.ts` and `en.ts` only — **no** `messages/ja.ts`.
- **Data locale:** list/picker reads pass `locale` from `useLocale()` so BE resolves labels via translation fallback. Admin edit loads `GET …/:id?view=edit` for canonical + full `translations` (independent of UI chrome language for stored locales).

User-facing tree labels avoid technical “node” wording:

| Context | Vietnamese | English |
|---------|------------|---------|
| Topics table column `child_render` | Chủ đề con | Sub-topics |
| Skills table column `child_render` | Kỹ năng con | Sub-skills |
| Tree view button / dialog | Xem cây / `{name} — cây` | View tree / `{name} — tree` |
| Shared `dagreTree.*` (layout toggles, empty state) | Dọc, Ngang, … | Vertical, Horizontal, … |
| Topics tree editor | Thêm chủ đề con, Tên chủ đề con, … | Add sub-topic, … |
| Skills tree editor | Thêm kỹ năng con, … | Add sub-skill, … |

## Tree visualization (read-only)

Topics and skills list rows with nested `child_topics` / `children` show a **View tree** button in the `child_render` column. It opens shared `DagreTreeDialog` with `nodesDraggable={false}` (read-only layout; no manual node repositioning). The list row is the graph root; descendants use `@xyflow/react` + `dagre`. Each node shows **resolved name** for the current list `locale` (no slug). Layout toggles: vertical (default) or horizontal. Rows with no child nodes show a disabled button with tooltip.

Edit/reorder still uses `SortableTreeEditor` in the form dialog — separate from the read-only dagre popup. On edit, tree nodes carry optional per-node `translations` maps (same canonical ↔ `en` sync rules as root).

## Drag-and-drop

- **Topics / skills:** nested tree order in the form dialog (`child_topics` / `children`).
- **Outcomes:** paragraph list order in the form dialog (`description[]`).
- **Levels / tags:** table column sort only (no reorder API).

## Image fields

Topics and outcomes support optional `image_file_id` (media file UUID). The form dialog opens **Browse media** (`MediaCollectionDialog` with `visibleTabs={["image"]}` only — no document/video tabs) when the user has `media_file:read`. Selection callback receives both the selected `file` and active-tab `type`; taxonomy accepts only `type === "image"`, then stores `file.id` and shows a thumbnail when picked in-session. On edit, preview also hydrates from API field `image_file_url`. The preview/picker UI is implemented via shared component `ImageFileField` at `src/components/shared/image-file-field.tsx`. See [media-collection.md](./media-collection.md).

## Slug (read-only preview; server authority)

- UI preview uses `slugifyName()` / `generateSlug()` in `src/lib/utils/slug.ts` (trim, lowercase, remove Vietnamese accents, `đ/Đ -> d`, spaces/underscores → `-`, keep Unicode letters/numbers, collapse repeated dashes).
- On edit, slug preview falls back to API `slug` until the watched canonical `name` field is non-empty (avoids empty preview when `useWatch` lags behind `defaultValues` after dialog remount).
- Slug field is **read-only** on create and edit; users only type the name.
- **Create/update API payloads omit `slug`** — BE derives it from **canonical `name`** (and from each tree node canonical `name`) via `utils.SlugifyName`. Non-`en` translation-only edits do not regenerate slug.
- Tree nodes: canonical name is editable, slug preview is read-only; write payload omits `slug` on `TaxonomyTreeNode` (use `toTaxonomyTreeWritePayload()` in `src/lib/utils/taxonomy/`).

## List query types

`TaxonomyListFilters` extends shared `ApiListQueryParams` with typed-search fields and locale:

- `search_by`: `name | slug | short_description`
- `search_value`: text value used with `search_by`
- **`locale`**: content locale for resolved list labels (from `useLocale()`; omit → BE defaults to `en`)

Query strings are built from shared `apiListQueryToRecord()` plus taxonomy-specific `search_by`/`search_value`/`locale`/`include_images` keys in `src/api/callers/taxonomy/taxonomy.ts`.

## List toolbar (FilterBy)

Taxonomy list screens use the built-in `DataTable` toolbar:

- `FilterBy` options are derived from table columns and constrained by resource searchable-field config.
- The `status` filter option provides `customInputComponent` directly on its `DataTableFilterByOption`.
- When `FilterBy` points to an option with `customInputComponent` (currently `status`), the default search input is hidden and that custom input is shown (`All statuses`, `Active`, `Inactive`).
- When `FilterBy` is not `status`, the search input + search action are shown.
- Text search sends `search_by` + `search_value` and resets page to `1`.
- List requests always include `locale` from `useLocale()` so display columns match the UI language.

## Create/edit dialog open

- `TaxonomyListPage` keeps `formDialogKey` state; `openCreate` / `openEdit` increment it and render `<TaxonomyFormDialog key={formDialogKey} … />`.
- Controlled `open` from the table does **not** invoke Radix `onOpenChange(true)`, so remount + mount-time init replaces `syncFormState` in `handleOpenChange`.
- **Edit always loads detail:** `getTaxonomyDetailService(resource, id, { view: "edit" })` — list row is insufficient for full `translations` / tree translations / `row_version`.
- `TaxonomyFormDialog` builds `defaultValues` from that editable detail (`buildTaxonomyFormDefaultValues`, tree/description/image helpers). No `useEffect` form sync (react-compiler safe).

## Form: locale picker + translations

- **No en/vi pill Tabs** in `TaxonomyLocaleTabsSection` — language switch + add is a **single searchable dropdown** over `CONTENT_LOCALE_OPTIONS`.
- Defaults still seed form state with **`en` / `vi`** (`DEFAULT_CONTENT_LOCALES`); the combobox shows the active locale label and lists presets (already-open locales switch focus; unused presets add + switch).
- Combobox copy: closed trigger shows the **active** locale label; search placeholder **`localeSearchPlaceholder`** (“Chọn ngôn ngữ” / “Select language”); empty filter **`localeEmpty`** (“Không có ngôn ngữ cần tìm” / “No languages found”).
- Selection must resolve to an **allowed preset** via `resolveAllowedContentLocale` (canonicalize + whitelist). **No free-enter** — typed text only filters the list; `CommandEmpty` does not add a custom locale; invalid codes toast `invalidLocale`.
- `CommandList` uses **`scrollbar-app`** (visible thin scrollbar) + `max-h` so long preset lists scroll inside the popover.
- **Inside `TaxonomyFormDialog`:** do **not** portal the language `Popover` to `document.body` (`PopoverContent portal={false}`). Radix Dialog sets `body { pointer-events: none }` while open; a default portaled popover sits under `body`, inherits that, and the list looks “unscrollable / unclickable”. Keeping content in the dialog tree inherits the dialog’s `pointer-events: auto`. Prefer this scoped opt-in over changing shared `PopoverContent` defaults (also used by `SearchableSelect`).
- Toast / validation messages that mention a locale use **friendly labels** via `contentLocaleOptionLabel`.
- Locale/form helpers live in `src/lib/utils/taxonomy/form-helpers.ts`; submit payload builders + persist wrappers live in `src/lib/utils/taxonomy/form-submit.ts` (import that path directly — not via the `@/lib/utils/taxonomy` barrel, which omits form-submit to avoid a cycle with API callers). Components under `components/features/taxonomy/` stay UI-only.
- Form state holds canonical fields and a `translations` map; outcome uses per-locale `short_description` + `description[]`.
- Non-`en` name / short_description inputs use the same max lengths as canonical (`name` 255, short 100); BE validates every locale after canonicalize.
- Any outcome translation locale that is kept in the payload **must** have non-empty `short_description` (client + server validation; description-only → error, not silent drop).
- Tree editors accept optional per-node `translations`.
- Submit sends canonical and/or `translations`; update includes **`expected_row_version`** from the edit GET.
- Submitted `translations` map is the full SoT: clearing a locale tab removes that locale from the payload so BE deletes the DB translation row in the same transaction. BE rejects colliding raw keys that canonicalize to one locale with different payloads.
- Canonical ↔ `en` mismatch is rejected by BE (4xx) — FE should keep them aligned when both are edited.

## Validation and API errors

- **Schemas**: `src/schema/taxonomy/taxonomy.ts` — `taxonomySlugStatusSchema`, `taxonomyTopicSchema`, `taxonomySkillSchema`, `taxonomyOutcomeSchema` (i18n keys under `taxonomy.form.validation.*`).
- **Form UI**: `TaxonomyFormDialog` uses `RequiredLabel` + `FieldError` on `name` / `short_description`; Zod enforces `name` 1–255 and outcome fields per BE; keys resolve via `useTranslations("taxonomy.form")` + `validation.*`; slug preview stays read-only (`required={false}`).
- **Client checks**: Zod via `zodResolver` before submit; tree/description editors remain separate state (validated on submit through parent schema).
- **API failures**: list delete and form create/update catch → `toastApiError(useTranslations("errors.codes"), error)` — never `taxonomy.common.errorGeneric` for API responses. Stale lock → **3005** / HTTP 409 (same as course).

**List query (BE):** `page`, `per_page`, `sort_by`, `sort_desc`, `status`, `search_by`, `search_value`, **`locale`**, optional `include_images` (default `true`; `false` skips image URL hydration on topics/outcomes — used by course editor info tab via `useTaxonomyList`, not admin CRUD screens).

**Get by id:** `locale` for localized shape; `view=edit` for admin editable DTO (`row_version`, `translations`, `available_locales`).

## Sample data

Create rows via the admin UI or BE `curl` examples in `be-mycourse/docs/curl_api.md` §12.
