# Session: Remove dead `BrowseMenuTree` + docs sync

**Date:** 2026-05-22

## Code

- Deleted `src/components/common/header/browse-menu-tree.tsx` (unused; mobile uses `BrowseSidebarMenu`).
- Removed `export * from "./browse-menu-tree"` from `header/index.ts`.

## Verify

- `npm run lint` — pass
- `npm run build` — pass

## Docs updated

| File | Change |
|------|--------|
| `docs/components.md` | Removed `BrowseMenuTree` row; expanded `HeaderMobileSidebar`, `BrowseSidebarMenu`, `header/index.ts` barrel |
| `docs/folder-structure.md` | Header file list + barrel vs direct-import note |
| `docs/reusable-assets.md` | `BROWSE_MENU_ITEMS` consumers |
| `docs/architecture.md` | `header/` tree comment |
| `docs/screens.md` | Mobile sidebar z-index, body lock, `BrowseSidebarMenu` detail |

## Note

Older `.context/session_summary_*` files still mention `browse-menu-tree.tsx` as historical session logs — not rewritten.
