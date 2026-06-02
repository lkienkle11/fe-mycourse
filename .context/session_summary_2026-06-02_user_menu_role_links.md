# Session: FE user menu role links + temporary legacy permission relaxation

**Date:** 2026-06-02

## Goal

Update the authenticated header/mobile user menu so legacy study/account links stay visible temporarily, while adding permission-gated role-switch links for `/sysadmin`, `/admin`, and `/instructor`. Then extend every current dropdown item with a `titleKey` while preserving the original `title` string. Sync i18n, docs, and context. No BE code changes.

## Discovery

- FE source of truth for the dropdown is `src/constants/common.ts` (`HEADER_DROPDOWN_ITEMS`) rendered by `src/components/common/auth-menu/user-menu-dropdown-items.tsx`.
- Permission filtering path is unchanged: `useFilteredUserMenuGroups()` → `filterUserMenuGroups()` → `filterUserMenuItems()` / `filterPermissionNavTree()`.
- BE role-modify semantics were verified read-only from `be-mycourse/docs/modules/rbac.md`:
  - `sysadmin:modify` → sysadmin-tier actions
  - `admin:modify` → admin-tier actions
  - `instructor:modify` → instructor-tier actions
  - Grants: sysadmin → all three, admin → `admin:modify` + `instructor:modify`, instructor → `instructor:modify`

## GitNexus pre-edit safety

- `npx gitnexus status` reported the FE index stale, so it was refreshed with `npx gitnexus analyze --force`.
- Impact checks:
  - `useFilteredUserMenuGroups` → **LOW**, 1 direct caller (`UserMenuDropdownItems`), 1 affected process
  - `filterUserMenuGroups` → **LOW**, depth-1 `useFilteredUserMenuGroups`, depth-2 `UserMenuDropdownItems`
  - `UserMenuDropdownItems` → **LOW**, 0 upstream callers in index
  - `UserMenuDropdownLinks` → **LOW**, 0 upstream callers in index
- `HEADER_DROPDOWN_ITEMS` and `UserMenuItem` were not directly resolvable by GitNexus `impact`, so file/symbol references were confirmed via `gitnexus query/context` plus repo search before editing.

## Files changed

| Action | Path | Purpose |
|--------|------|---------|
| Edit | `src/types/user-menu.ts` | Add optional `titleKey` to `UserMenuItem` for translated labels |
| Edit | `src/constants/common.ts` | Comment legacy item guards; add new `roles` group with `sysadmin` / `admin` / `instructor` links; later reorder roles first and add `titleKey` to every current item |
| Edit | `src/components/common/auth-menu/user-menu-dropdown-items.tsx` | Resolve optional `titleKey` via `commonHeader.userMenu.*` |
| Edit | `src/messages/en.ts` | Add English labels for all current dropdown item `titleKey` values |
| Edit | `src/messages/vi.ts` | Add Vietnamese labels for all current dropdown item `titleKey` values |
| Edit | `README.md` | Sync permission/menu behavior notes |
| Edit | `docs/components.md` | Document translated user-menu labels |
| Edit | `docs/reusable-assets.md` | Document `titleKey` and role-switch menu behavior |
| Edit | `docs/logic-flow.md` | Document temporary legacy guard relaxation and role-switch gating |
| Edit | `docs/screens.md` | Update dropdown structure and permissions table |
| Edit | `docs/folder-structure.md` | Refresh audit note + type/config descriptions |

## Behavior after change

- The `roles` group is now the first group in `HEADER_DROPDOWN_ITEMS`.
- Study/account links (`My Courses`, `My Cart`, `Wishlist`, `Notifications`, `Account Settings`) remain visible because their `permissions` lines are intentionally commented out in config.
- New role-switch group appears before logout:
  - `Sysadmin` → `/sysadmin` → `sysadmin:modify`
  - `Admin` → `/admin` → `admin:modify`
  - `Instructor` → `/instructor` → `instructor:modify`
- Desktop `UserMenu` and mobile `SidebarAuthFooter` share the same filtered output through `UserMenuDropdownItems`.
- Labels for all current dropdown links are wired through `commonHeader.userMenu` in both `en` and `vi`, while the original `title` strings remain in config as fallback values.

## GitNexus changed-scope check

- `detect_changes({ repo: "fe-mycourse", scope: "all" })` was executed through the local GitNexus backend.
- Result: **11 changed files**, **4 affected processes**, **risk: medium**.
- Affected processes are all the expected `UserMenuDropdownItems` permission flows:
  - `UserMenuDropdownItems → HasAnyPermission`
  - `UserMenuDropdownItems → HasAllPermissions`
  - `UserMenuDropdownItems → UseGetMe`
  - `UserMenuDropdownItems → ToPermissionSet`

## QA

| Check | Result |
|-------|--------|
| `npm run lint` | pass with pre-existing warnings from generated `.jscpd-report/html/js/prism.js` |
| `npm run lint:biome` | pass with 1 pre-existing warning in `src/components/ui/sidebar.tsx` (`document.cookie`) |
| `npx tsc --noEmit` | pass |
| `npm run build` | pass after rerun with network access for Google Fonts |
| `npm run quality:deps` | pass for circular deps; jscpd reports 4 pre-existing clones |

## Notes

- No new permission utility, component, or parallel filtering path was introduced; the existing menu config/type/filter pipeline was extended and reused.
- BE was used as read-only documentation/source-of-truth only. No BE files were changed.
