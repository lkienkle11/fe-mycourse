# Session: Course admin ⋮ menu → dialog pointer-events fix

**Date:** 2026-06-26  
**Repo:** `fe-mycourse` (uncommitted)

## Problem

After approve/reject on **Chờ xét duyệt** (or any ⋮ menu action that opens a dialog), the dashboard became unclickable — sidebar, tabs, and forms frozen until full page reload.

**Root cause:** `document.body` kept `pointer-events: none` when a modal `DropdownMenu` and a nested `Dialog`/`AlertDialog` overlapped (Radix dismissable-layer stack).

## Fix (shared abstraction)

| File | Change |
|------|--------|
| `src/lib/utils/defer-dropdown-action.ts` | **NEW** — `deferDropdownAction()` helper |
| `src/components/shared/deferred-dropdown-menu-item.tsx` | **NEW** — `DeferredDropdownMenuItem` (`onSelect` + defer) |
| `course-admin-table-actions-menu.tsx` | `DropdownMenu modal={false}` |
| `course-review-row-actions.tsx` | Approve/Reject → `DeferredDropdownMenuItem` |
| `course-admin-all-page.tsx` | Move to trash → `DeferredDropdownMenuItem` |
| `course-admin-trash-page.tsx` | Restore / permanent delete → `DeferredDropdownMenuItem` |
| `course-editor-outline-row-actions.tsx` | `modal={false}` + `DeferredDropdownMenuItem` for add/edit/delete (section/lesson/sub-lesson dialogs) |

## Verification

- Chrome DevTools MCP: approve flow → `bodyPointerEvents` = `"auto"` after dialog close; sidebar navigation works
- `npm run check-all` — PASS (2026-06-26, re-run after shared abstraction)
- `npm run test-all` — PASS
- `make check-all` (be) — PASS (no BE code changes)
- `npx gitnexus analyze` — synced after refactor

## Docs synced

`docs/logic-flow.md` (§14), `docs/components.md`, `docs/instructor-admin.md`, `docs/screens.md`, `docs/modules.md`, `docs/patterns.md`, `docs/router.md`, `docs/reusable-assets.md`
