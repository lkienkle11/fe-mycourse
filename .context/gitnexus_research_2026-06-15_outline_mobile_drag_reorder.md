# GitNexus research — outline mobile drag reorder (FE)

**Date:** 2026-06-15  
**Task:** Fix section/lesson/item drag reorder on mobile (course outline tab)

## gitnexus_query

```json
{ "query": "outline drag reorder sortable mobile touch", "repo": "fe-mycourse" }
```

**Key processes:**
- `proc_13_handlereorderlessons` — `HandleReorderLessons → RequireUrl`
- `proc_16_handlereordersubless` — `HandleReorderSubLessons → RequireUrl`
- `proc_22_handlereordersection` — `HandleReorderSections → RequireUrl`

**Key symbols:**
- `useCourseOutlineReorder` — optimistic SWR patch + reorder API
- `runOptimisticOutlineReorder` — cache update before API
- `SortableList` / `SortableTreeEditor` — shared `@dnd-kit` wrappers

## gitnexus_context

```json
{ "name": "SortableList", "repo": "fe-mycourse" }
```

- **File:** `src/components/shared/sortable-list.tsx`
- **Callers (manual grep):** `course-editor-outline-tab.tsx`, `sortable-tree-editor.tsx`, `taxonomy-description-editor.tsx`
- **Outgoing:** `cn` utility only

## gitnexus_impact (pre-edit)

```json
{ "target": "SortableList", "direction": "upstream", "repo": "fe-mycourse" }
```

- **Risk:** LOW
- **Direct callers in index:** 0 (stale index; grep confirms 3 import sites)
- **Blast radius:** shared component — outline + taxonomy surfaces

## Root cause (Chrome DevTools mobile 390×844)

| Issue | Before | After |
|-------|--------|-------|
| Sensors | `PointerSensor` only | `MouseSensor` + `TouchSensor` |
| Touch scroll conflict | `touch-action: auto` | `touch-none` on grip |
| Hit target | 16×16px | 44×44px mobile (`size-11`) |

## Files to change (Phase 2)

1. `src/components/shared/sortable-list.tsx` — sensor + handle fix
2. Docs sync (Phase 3): `reusable-assets.md`, `components.md`, `pages.md`, `router.md`, `folder-structure.md`, `screens.md`, `modules.md`, `instructor-admin.md`
