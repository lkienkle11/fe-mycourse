import { PERMISSION_IDS } from "@/constants/permission-ids";
import { PERMISSIONS } from "@/constants/permissions";
import type {
  ParsedPermission,
  PermissionAction,
  PermissionId,
  PermissionName,
} from "@/types/permissions";

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
