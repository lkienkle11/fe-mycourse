"use client";

import { useMemo } from "react";
import { HEADER_DROPDOWN_ITEMS } from "@/constants/common";
import {
  filterUserMenuGroups,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  satisfiesPermissions,
  toPermissionSet,
} from "@/lib/utils/permission";
import type {
  PermissionName,
  PermissionRequirement,
} from "@/types/permissions";
import type { UserMenuGroup } from "@/types/user-menu";
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

/** Boolean guard for arbitrary config (`PermissionRequirement`). */
export function useSatisfiesPermissions(
  requirement: PermissionRequirement,
): boolean {
  const set = usePermissionSet();
  return satisfiesPermissions(set, requirement);
}

/** Memoized menu groups filtered by current user permissions. */
export function useFilteredUserMenuGroups(
  groups: readonly UserMenuGroup[] = HEADER_DROPDOWN_ITEMS,
): UserMenuGroup[] {
  const set = usePermissionSet();
  return useMemo(() => filterUserMenuGroups(set, groups), [set, groups]);
}
