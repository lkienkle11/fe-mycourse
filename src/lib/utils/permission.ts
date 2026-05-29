import { PERMISSION_IDS } from "@/constants/permission-ids";
import { PERMISSIONS } from "@/constants/permissions";
import type {
  ParsedPermission,
  PermissionAction,
  PermissionCheckMode,
  PermissionId,
  PermissionName,
  PermissionRequirement,
} from "@/types/permissions";
import type { UserMenuGroup, UserMenuItem } from "@/types/user-menu";

const PERMISSION_ACTIONS: readonly PermissionAction[] = [
  "read",
  "create",
  "update",
  "delete",
  "modify",
];

const WRITE_ACTIONS: readonly PermissionAction[] = [
  "create",
  "update",
  "delete",
  "modify",
];

/** Build a Set for O(1) permission lookup (mirrors BE JWT permission map). */
export function toPermissionSet(perms: readonly string[]): Set<string> {
  return new Set(perms);
}

/** Check a single permission name against the set. */
export function hasPermission(
  set: ReadonlySet<string>,
  name: PermissionName,
): boolean {
  return set.has(name);
}

/** User must have all listed permissions (mirrors BE `RequirePermission`). */
export function hasAllPermissions(
  set: ReadonlySet<string>,
  ...names: PermissionName[]
): boolean {
  return names.every((name) => set.has(name));
}

/** User must have at least one of the listed permissions (FE UI OR-guards). */
export function hasAnyPermission(
  set: ReadonlySet<string>,
  ...names: PermissionName[]
): boolean {
  return names.some((name) => set.has(name));
}

/**
 * Config-driven check: empty/omitted permissions => visible.
 * `permissionMode` defaults to `"all"` (mirrors BE `RequirePermission`).
 */
export function satisfiesPermissions(
  set: ReadonlySet<string>,
  requirement: PermissionRequirement,
): boolean {
  const { permissions, permissionMode = "all" } = requirement;
  if (!permissions || permissions.length === 0) {
    return true;
  }
  if (permissionMode === "any") {
    return hasAnyPermission(set, ...permissions);
  }
  return hasAllPermissions(set, ...permissions);
}

/** Thin wrapper for inline permission checks. */
export function canShowWithPermissions(
  set: ReadonlySet<string>,
  permissions?: readonly PermissionName[],
  mode: PermissionCheckMode = "all",
): boolean {
  return satisfiesPermissions(set, { permissions, permissionMode: mode });
}

/** Nav node shape shared by dashboard sidebar and nested user menu items. */
export type PermissionNavNode = PermissionRequirement & {
  href?: string;
  children?: PermissionNavNode[];
};

/**
 * Bottom-up permission filter for nested nav trees.
 *
 * 1. Recurse into `children` first (all depths).
 * 2. Leaf with `href`: keep only when `satisfiesPermissions` passes on that node.
 * 3. Branch without `href`: keep when any filtered descendant remains (parent
 *    permissions do not hide permitted deep leaves).
 */
export function filterPermissionNavTree<T extends PermissionNavNode>(
  set: ReadonlySet<string>,
  items: readonly T[],
): T[] {
  const result: T[] = [];

  for (const item of items) {
    const filteredChildren = item.children?.length
      ? filterPermissionNavTree(set, item.children)
      : undefined;
    const children =
      filteredChildren && filteredChildren.length > 0
        ? filteredChildren
        : undefined;

    const hasHref = Boolean(item.href);
    const hasVisibleChildren = Boolean(children?.length);
    const selfAllowed = satisfiesPermissions(set, item);

    if (hasHref) {
      if (!selfAllowed) {
        continue;
      }
      result.push({ ...item, children });
      continue;
    }

    if (hasVisibleChildren) {
      result.push({ ...item, children });
    }
  }

  return result;
}

/** Recursively filter user menu items (supports optional nested `children`). */
export function filterUserMenuItems(
  set: ReadonlySet<string>,
  items: readonly UserMenuItem[],
): UserMenuItem[] {
  return filterPermissionNavTree(set, items) as UserMenuItem[];
}

/**
 * Filter menu groups: deep-filter each group's items, drop empty groups.
 * Group-level `permissions` are not used as a pre-gate (only descendants matter).
 */
export function filterUserMenuGroups(
  set: ReadonlySet<string>,
  groups: readonly UserMenuGroup[],
): UserMenuGroup[] {
  const result: UserMenuGroup[] = [];

  for (const group of groups) {
    const value = filterUserMenuItems(set, group.value);
    if (value.length === 0) {
      continue;
    }
    result.push({ ...group, value });
  }

  return result;
}

/**
 * Split `resource:action` (e.g. `course_instructor:read`, `sysadmin:modify`).
 * Returns null when the action is not a known `PermissionAction`.
 */
export function parsePermissionName(name: string): ParsedPermission | null {
  const colon = name.lastIndexOf(":");
  if (colon <= 0 || colon === name.length - 1) {
    return null;
  }
  const resource = name.slice(0, colon);
  const action = name.slice(colon + 1);
  if (!PERMISSION_ACTIONS.includes(action as PermissionAction)) {
    return null;
  }
  return { resource, action: action as PermissionAction };
}

/** Type guard: permission name ends with `:action`. */
export function isPermissionAction(
  name: string,
  action: PermissionAction,
): boolean {
  return parsePermissionName(name)?.action === action;
}

export function isReadPermission(name: string): boolean {
  return isPermissionAction(name, "read");
}

export function isWritePermission(name: string): boolean {
  const parsed = parsePermissionName(name);
  return parsed !== null && WRITE_ACTIONS.includes(parsed.action);
}

/** Bidirectional map: permission name ↔ DB permission_id (for admin UI). */
export const PERMISSION_NAME_TO_ID = Object.fromEntries(
  (Object.keys(PERMISSIONS) as (keyof typeof PERMISSIONS)[]).map((key) => [
    PERMISSIONS[key],
    PERMISSION_IDS[key],
  ]),
) as Record<PermissionName, PermissionId>;

/** Lookup permission name from DB id (e.g. `P5` → `course:read`). */
export function permissionNameFromId(id: PermissionId): PermissionName | null {
  const key = (
    Object.keys(PERMISSION_IDS) as (keyof typeof PERMISSION_IDS)[]
  ).find((k) => PERMISSION_IDS[k] === id);
  return key ? PERMISSIONS[key] : null;
}

/** Lookup DB id from permission name (e.g. `course:read` → `P5`). */
export function permissionIdFromName(
  name: PermissionName,
): PermissionId | null {
  const key = (Object.keys(PERMISSIONS) as (keyof typeof PERMISSIONS)[]).find(
    (k) => PERMISSIONS[k] === name,
  );
  return key ? PERMISSION_IDS[key] : null;
}
