# Session pipeline: FE mobile header + docs full sync

**Date:** 2026-05-21  
**Scope:** `fe-mycourse` (primary). `be-mycourse`: no working-tree changes — backend CI skipped.

---

## GitNexus

| Repo | Command | Result |
|------|---------|--------|
| **fe-mycourse** | `npx gitnexus analyze --force` | **1578** nodes, **3196** edges, **69** flows |
| **be-mycourse** | `npx gitnexus analyze --force` | Reindexed (no FE code delta this session) |

`CLAUDE.md` / `AGENTS.md` refreshed on **fe-mycourse**.

---

## Frontend quality gate

| Check | Result |
|-------|--------|
| `npm run lint` (eslint) | Pass |
| `npm run lint:biome` | Pass (3 pre-existing warnings: `field.tsx`, `sidebar.tsx`) |
| `npx tsc --noEmit` | Pass |
| `npm run build` | Pass |

## Backend quality gate

| Check | Result |
|-------|--------|
| `golangci-lint` / build | **Skipped** — `be-mycourse` git status clean (no changes in this branch of work) |

---

## Code review (latest fixes)

### Browse menu scroll (mobile sidebar)

| Issue | Fix |
|-------|-----|
| Cannot swipe scroll category list | Replaced `ScrollArea` with native `overflow-y-auto` + `min-h-0 flex-1` on panel |
| Panel height undefined in flex | `aside`: `h-dvh max-h-dvh` |
| Nested accordion clips children | `BrowseMenuTree` `AccordionContent`: `h-auto! overflow-visible` |
| Parent accordion blocks overflow | `ui/accordion.tsx`: `data-open:overflow-visible` |

**Files:** `header-mobile-sidebar.tsx`, `browse-menu-tree.tsx`, `accordion.tsx`

### Earlier in branch (uncommitted snapshot)

- Mobile sidebar portal (right), auth modal z-300, `useCustomLanguage` store/hooks
- `LoginSignupPopup` outside sticky header
- Docs full sync (15× `docs/*.md`) — see `.context/session_summary_2026-05-21_docs_full_sync.md`

---

## Docs updated this pipeline

- `docs/components.md` — sidebar scroll (`overflow-y-auto`), `BrowseMenuTree`, `Accordion` overflow
- `docs/screens.md` — scrollable body wording

Prior full sync: `pages`, `router`, `architecture`, `flow`, `reusable-assets`, etc. (already aligned 2026-05-21).

---

## Untracked / modified (FE) — commit checklist

**New files:** `browse-menu-tree.tsx`, `header-mobile-sidebar.tsx`, `header-mobile-bar.tsx`, `sidebar-auth-footer.tsx`, `user-menu-dropdown-items.tsx`, `hooks/language/*`, `lib/language/*`, `store/language/*`

**Modified:** header, auth popup, dialog, accordion, layout, messages, all docs

---

## Manual test

- [ ] Mobile sidebar: swipe scroll full browse list (root + nested)
- [ ] Expand Design → Illustration → scroll to bottom
- [ ] Locale + auth footer still visible (not scrolled away)
- [ ] Login modal above open sidebar
