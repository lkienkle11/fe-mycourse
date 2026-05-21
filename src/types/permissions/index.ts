import { PERMISSION_IDS } from "@/constants/permission-ids";
import { PERMISSIONS } from "@/constants/permissions";
import type { ROLES } from "@/constants/roles";

export type PermissionName = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export type PermissionId = (typeof PERMISSION_IDS)[keyof typeof PERMISSION_IDS];

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

export type PermissionAction =
  | "read"
  | "create"
  | "update"
  | "delete"
  | "modify";

export type ParsedPermission = {
  resource: string;
  action: PermissionAction;
};

export type PermissionCheckMode = "all" | "any";

/** Config-driven guard: empty/omitted permissions => allow (when user is authenticated). */
export type PermissionRequirement = {
  permissions?: readonly PermissionName[];
  permissionMode?: PermissionCheckMode;
};

/** Bidirectional map: permission name ↔ DB permission_id (for admin UI). */
export const PERMISSION_NAME_TO_ID = Object.fromEntries(
  (Object.keys(PERMISSIONS) as (keyof typeof PERMISSIONS)[]).map((key) => [
    PERMISSIONS[key],
    PERMISSION_IDS[key],
  ]),
) as Record<PermissionName, PermissionId>;
