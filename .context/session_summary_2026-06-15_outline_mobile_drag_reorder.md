# Session summary — outline mobile drag reorder (FE)

**Date:** 2026-06-15  
**Research:** `.context/gitnexus_research_2026-06-15_outline_mobile_drag_reorder.md`  
**Standards:** `temporary-docs/tieu-chuan-check-be-fe/fe-mycourse.md` (all 3 phases)

## Phase 1 — Discovery

- Read latest context: `session_summary_2026-06-15_outline_sub_lesson_kind_icons.md`
- Read docs: `router.md`, `folder-structure.md`, `pages.md`, `reusable-assets.md`, `quality.md`
- Reuse target: shared `SortableList` (`@dnd-kit`) — used by outline tab, taxonomy tree, taxonomy description editor
- GitNexus: `query`, `context(SortableList)`, `impact(SortableList)` → LOW risk
- Git audit: branch `feat/outline-sub-lesson-kind-icons`, only `sortable-list.tsx` modified

## Phase 2 — Implementation

**File changed:** `src/components/shared/sortable-list.tsx`

1. Replace `PointerSensor` with `MouseSensor` (distance 8px) + `TouchSensor` (delay 200ms, tolerance 5px)
2. Drag handle: `touch-none`, mobile 44×44px hit target (`size-11`), desktop compact
3. Chrome DevTools mobile emulation (390×844, touch): verified sub-lesson reorder + toast `Đã lưu thứ tự nội dung bài học.`

## Phase 3 — Quality + Docs + Close-out

### Quality gates (all pass)

```bash
npm run lint:biome
npm run lint
npm run build
npm run quality:deps
```

### Docs updated

- `docs/reusable-assets.md` — SortableList mobile sensors + hit target
- `docs/components.md` — SortableList row
- `docs/pages.md` — OUTLINE tab mobile drag note
- `docs/router.md` — audit line
- `docs/folder-structure.md` — SortableList comment
- `docs/screens.md` — outline SortableList mobile note
- `docs/modules.md` — reuse point
- `docs/instructor-admin.md` — drag reorder mobile note

### GitNexus close-out

- `gitnexus_detect_changes({ scope: "all" })` — low risk, `sortable-list.tsx` only
- `npx gitnexus analyze` — reindexed

## Manual test steps

1. Log in with a local dev account
2. Open `/{locale}/instructor/courses/{courseId}/outline`
3. DevTools → mobile viewport (e.g. iPhone 12, 390px)
4. **Hold ~0.2s** on grip icon (⋮⋮) for section / lesson / item row
5. Drag up/down → release → toast reorder success
6. Repeat on taxonomy tree editor (same `SortableList` component)

## Completion criteria

- [x] Mobile drag reorder works for section, lesson, item on outline tab
- [x] Docs synced with code
- [x] Quality checks pass
- [x] Context handoff written
- [x] GitNexus close-out done
