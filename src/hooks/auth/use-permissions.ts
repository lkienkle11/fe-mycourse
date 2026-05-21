"use client";

import { useMemo } from "react";
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  toPermissionSet,
} from "@/lib/utils/permission";
import type { PermissionName } from "@/types/permissions";
import { useGetMe } from "./use-auth-store";

/** Memoized Set from `useGetMe().mePermissions` for O(1) checks. */
export function usePermissionSet(): Set<string> {
  const { mePermissions } = useGetMe();
  return useMemo(() => toPermissionSet(mePermissions), [mePermissions]);
}

export function useHasPermission(permission: PermissionName): boolean {
  const set = usePermissionSet();
  return hasPermission(set, permission);
}

export function useHasAllPermissions(
  ...permissions: PermissionName[]
): boolean {
  const set = usePermissionSet();
  return hasAllPermissions(set, ...permissions);
}

export function useHasAnyPermissions(
  ...permissions: PermissionName[]
): boolean {
  const set = usePermissionSet();
  return hasAnyPermission(set, ...permissions);
}
