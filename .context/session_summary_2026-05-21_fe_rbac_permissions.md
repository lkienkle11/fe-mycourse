# Session: FE RBAC permissions & guard utilities

**Date:** 2026-05-21

## Goal

Mirror BE `AllPermissions` (P1–P40) on the frontend: constants, types, pure utils, React hooks, and docs sync. No BE changes.

## Discovery

- FE had 9 stale permission strings; `actions.ts` / `BASIC_ACTIONS` deleted in working tree, docs still referenced them.
- `mePermissions` flows: `useAuth` → `useSyncMeFromAuth` → `useGetMe()` (GitNexus: `MeSwrSync` → `useSyncMeFromAuth`).
- BE canonical catalog: `internal/shared/constants/permissions.go` (40 names, P1–P40); roles in `roles_permission.go`.

## Files added

| Path | Purpose |
|------|---------|
| `src/constants/permissions.ts` | `PERMISSIONS` — 40 entries, PascalCase keys |
| `src/constants/permission-ids.ts` | `PERMISSION_IDS` — P1…P40 |
| `src/constants/roles.ts` | `ROLES` — sysadmin, admin, instructor, learner |
| `src/types/permissions/index.ts` | Types + `PERMISSION_NAME_TO_ID` |
| `src/lib/utils/permission.ts` | Set helpers, AND/OR checks, parse, id lookup |
| `src/hooks/auth/use-permissions.ts` | `useHasPermission`, `useHasAll/AnyPermissions` |

## Files edited

- `src/constants/index.ts`, `src/types/index.ts`, `src/lib/utils/index.ts`, `src/hooks/auth/index.ts`
- Docs: `reusable-assets.md`, `logic-flow.md`, `folder-structure.md`, `modules.md`, `README.md`

## Phantom removed

- `course:write`, `profile:course:*`, `rbac:manage`, `BASIC_ACTIONS`, `actions.ts` references in docs

## GitNexus (read-only, pre-edit)

- `query(fe, "permissions mePermissions")` → `useSyncMeFromAuth`, `useGetMe`, `MeResponse`
- `query(be, "AllPermissions RequirePermission")` → `RequirePermission`, `permissions.go`
- `context(useSyncMeFromAuth)` → caller `MeSwrSync` only; no hook edits needed

## GitNexus (post-edit)

- `npx gitnexus analyze --force` → **1612** symbols, **3277** edges, **74** flows
- `detect_changes(all)` → low risk, 10 changed files in working tree

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
import { useHasPermission } from "@/hooks/auth";

const canCreate = useHasPermission(PERMISSIONS.CourseCreate);
```

## Notes

- JWT cache: users must re-login after BE permission matrix changes.
- `/me` has `permissions[]` only — use permission-based UI, not `ROLES` alone, until BE exposes roles on `MeResponse`.
- Out of scope: `PermissionGate` component, admin route wiring, mass page refactor.
