# Session: FE menu permission guards

**Date:** 2026-05-21

## Goal

Wire RBAC into the user dropdown menu and reusable UI guards: config-driven `permissions` on menu items, filter utils/hooks, `PermissionGate`, docs sync.

## Discovery (Phase 1)

- PR #115 merged `feat/new-permissions-v1` (40 permissions, hooks, utils).
- Gap: `HEADER_DROPDOWN_ITEMS` had no permissions; `UserMenuDropdownItems` showed all links.
- GitNexus: `UserMenuDropdownItems` upstream impact **LOW** (0 direct callers in index); `hasAllPermissions` → `useHasAllPermissions` only.
- BE `RequirePermission` = AND; learner role grants `profile:read`, `course:read`, etc.

## Files changed

| Action | Path |
|--------|------|
| Edit | `src/types/permissions/index.ts` — `PermissionCheckMode`, `PermissionRequirement` |
| Edit | `src/constants/common.ts` — per-item `permissions` on `HEADER_DROPDOWN_ITEMS` only |
| Add | `src/types/user-menu.ts` — `UserMenuItem`, `UserMenuGroup`, `UserMenuStatus` |
| Edit | `src/lib/utils/permission.ts` — `satisfiesPermissions`, `canShowWithPermissions`, `filterUserMenuGroups` |
| Edit | `src/lib/utils/index.ts` |
| Edit | `src/hooks/auth/use-permissions.ts` — `useSatisfiesPermissions`, `useFilteredUserMenuGroups` |
| Add | `src/components/shared/permission-gate.tsx` |
| Edit | `src/components/shared/index.ts` |
| Edit | `src/components/common/auth-menu/user-menu-dropdown-items.tsx` |
| Docs | `docs/reusable-assets.md`, `logic-flow.md`, `modules.md`, `components.md`, `screens.md`, `folder-structure.md`, `README.md` |

## Menu permission table

| Item | Permissions |
|------|-------------|
| My Courses | `course:read` |
| My Cart, Wishlist | `profile:read` |
| Notifications, Account Settings | `profile:read` |
| Logout | *(none)* |

## GitNexus

- Pre-edit: `impact(UserMenuDropdownItems)` → LOW; `context(hasAllPermissions)` → `useHasAllPermissions`.
- Post-edit: `npx gitnexus analyze --force` → **1628** symbols, **3345** edges, **83** flows.

## QA

| Check | Result |
|-------|--------|
| `npm run lint` | pass |
| `npm run lint:biome` | pass (3 pre-existing warnings in `field.tsx`, `sidebar.tsx`) |
| `npx tsc --noEmit` | pass |
| `npm run build` | pass |

## Usage

```tsx
import { PERMISSIONS } from "@/constants/permissions";
import { PermissionGate } from "@/components/shared";
import { useFilteredUserMenuGroups, useSatisfiesPermissions } from "@/hooks/auth";

const groups = useFilteredUserMenuGroups();
const canEdit = useSatisfiesPermissions({ permissions: [PERMISSIONS.CourseUpdate] });

<PermissionGate permissions={[PERMISSIONS.UserRead]} fallback={null}>
  <AdminBlock />
</PermissionGate>
```
