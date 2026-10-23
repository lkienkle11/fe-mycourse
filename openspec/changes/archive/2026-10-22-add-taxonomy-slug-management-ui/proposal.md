## Why

The backend change `unify-taxonomy-slug-management` (be-mycourse) gives course levels, course topics, course skills, tags, and the tree nodes inside a topic's `child_topics` / a skill's `children` the same slug contract that courses already have: an optional manual `slug` on create (a taken manual slug answers `409` / `3007` with `data.recommended_slug`), an independent omittable `slug` on update (omitted keeps the stored slug even when `name` changes; blank is `400`; a collision is silently resolved with a suffix), and per-node slugs that are preserved by node `id` when omitted. The frontend still shows a read-only slug preview derived from the name (`slugifyName`) and strips every slug from write payloads, so admins cannot choose or edit a slug, the preview is now wrong after a rename (the backend no longer re-derives the slug from the name), and a taken manual slug could only surface as a generic error toast.

Implementing this by copying the course slug code would add a second copy of logic that already exists in several features. A codebase-wide audit found the same business capabilities implemented more than once (optional-field payload rule, slug zod rule, conflict suggestion state, labelled field block, validation-message resolver, nested-tree traversal) or owned by the wrong layer (a taxonomy-only editor in `components/shared`), so the change consolidates each capability into one neutral, capability-named module and migrates every consumer.

## What Changes

- **Root form (levels, topics, skills, tags; admin and sysadmin)**: replace the read-only derived slug preview with an editable, optional slug field. Blank on create means "let the backend generate it"; no client-side transliteration and no auto-fill from the name. On edit the field is seeded with the persisted slug and a slug is sent only when it differs from the persisted one; a blank slug on an existing item is blocked with a field error.
- **Create conflict flow**: on `409` / `3007` read `data.recommended_slug` and show the same stacked confirm dialog the course flow uses; Yes resubmits with the recommended slug (and repeats if a new conflict comes back), No returns to the form. The state machine is extracted from `useCourseCreateFlow` into one shared hook used by **both** course create and taxonomy create.
- **Update result**: after saving, take the slug from the response; if it differs from the slug that was sent, show a dedicated notice with the final slug. Update never opens a conflict dialog because the backend does not return `409` for slug on update.
- **Tree nodes (topics `child_topics`, skills `children`)**: each node shows its persisted slug as muted text with a pencil button that toggles an inline slug input; a new node shows an "auto-generated" placeholder. A node's `slug` is written only when the user supplied or changed it; untouched nodes omit it so the backend preserves them by `id`. A cleared slug on an existing node or an invalid node slug is blocked before submit with a node-attached error. When the response tree contains a node slug different from a manually sent one, a notice reports that node slugs were adjusted.
- **Deduplication and ownership refactors (behaviour-preserving)**, each migrating all consumers and deleting the old copies:
  - one optional-field payload rule (`src/lib/utils/payload.ts`) replacing 6 inline copies in course and taxonomy builders;
  - one slug zod rule set (`src/schema/shared/slug.ts`) moved out of the course schema;
  - one slug-conflict flow hook (`src/hooks/slug/`) and one stacked confirm component;
  - one labelled field block (`FormField`, `SlugField`) replacing 6 identical blocks; `AuthFieldError` and the auth-local message resolver removed in favour of the shared `FieldError` / `resolveValidationMessage` (made generic, dropping 8 casts);
  - one generic tree-traversal module (`src/lib/utils/tree.ts`) replacing the taxonomy count / max-depth copies, the dashboard nav finders, and the dagre walk;
  - the taxonomy-only tree editor moved out of `components/shared` into `features/taxonomy` and merged with its wrapper; taxonomy name/short-description limits shared between schema and inputs.
- **Removals**: the read-only `slugPreview`, `resolveTaxonomySlugPreview`, the per-node `slugifyName(node.name)` preview, the "strip slug from write payload" behaviour, and — once their only consumers are gone — `generateSlug` / `slugifyName`.
- **Messages**: new `taxonomy.*` keys (en + vi) for hint, conflict dialog, adjusted-slug notices, node slug labels and validation; `errors.codes.3007` already exists.
- **Documentation and context**: sync every affected document in English (full replacement, no appended notes) and the GitNexus index, following the `AGENTS.md` workflow end to end.

No backend change. No new API endpoint. Instructor slug is out of scope (deferred on the backend as well). Outcomes have no slug and are untouched. Capabilities examined and intentionally left as they are (different semantics or not part of this feature) are listed with reasons in `design.md`.

## Capabilities

### New Capabilities
- `taxonomy-slug-management`: taxonomy root and tree-node slug entry at creation and update, input filtering and validation, the `3007` recommended-slug confirmation on create, "send only when changed" payload rules, and reconciliation of the stored slugs after update.

### Modified Capabilities
- `frontend-regression-coverage`: adds requirements that the taxonomy slug flows, the shared conflict flow, and every behaviour-preserving consolidation (payload rule, tree utilities, validation resolver, labelled field, dashboard breadcrumbs, dagre elements, auth fields) are covered by automated tests.

## Impact

- **Shared primitives (new)**: `src/lib/utils/payload.ts`, `src/lib/utils/tree.ts`, `src/schema/shared/slug.ts`, `src/hooks/slug/use-slug-conflict-flow.ts`, `src/components/shared/{form-field,slug-field,slug-conflict-confirm-dialog}.tsx`, `src/constants/taxonomy/limits.ts`; `src/lib/utils/slug.ts` (adds `isSlugAdjusted`, loses `generateSlug`/`slugifyName`); `src/lib/utils/validation-message.ts` (generic resolver).
- **Migrated consumers**: course (`src/schema/course/course.ts`, `src/lib/utils/course.ts`, `src/hooks/course/use-course-create-flow.ts`, `src/hooks/course/use-course-editor-state.ts`, `src/screen/instructor/courses/page.tsx`, `src/components/features/course/course-editor-basic-tab.tsx`), auth (`src/components/common/auth-menu/auth/auth-form-fields.tsx`), media picker (`src/components/shared/image-file-field.tsx`), dashboard (`src/lib/navigation/dashboard-page-header.ts`), dagre (`src/lib/utils/dagre-tree.ts`).
- **Taxonomy**: `src/types/taxonomy/index.ts`, `src/schema/taxonomy/taxonomy.ts`, `src/lib/utils/taxonomy/{resource,form-helpers,form-submit}.ts`, `src/components/features/taxonomy/{taxonomy-form-dialog,taxonomy-tree-editor,taxonomy-tree-view-button}.tsx`, new `tree-node-slug-field.tsx`, deleted `src/components/shared/sortable-tree-editor.tsx`, `src/messages/{en,vi}.ts`.
- **Callers / routes / backend**: `src/api/callers/taxonomy/*` need no signature change (payload types widen only); the 10 admin/sysadmin route files are untouched; no backend or dependency change.
- **Tests**: new unit and component tests for every new module and every refactored consumer without coverage, the existing course/auth tests unchanged, new e2e spec and fixture-server taxonomy routes.
- **Detail**: per-file changes with signatures and call sites are in `design.md` ("Code change specification") and `code-change-inventory.md`; per-document edits (verbatim CURRENT → REPLACEMENT, English) are in `design.md` ("Documentation change specification") and `docs-update-inventory.md`; the task list in `tasks.md` follows the `AGENTS.md` workflow group by group.
- **Documentation**: 17 documents / 132 items, listed exhaustively in `docs-update-inventory.md`.
