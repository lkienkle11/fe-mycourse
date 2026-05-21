"use client";

import type { ReactNode } from "react";
import { useSatisfiesPermissions } from "@/hooks/auth";
import type { PermissionRequirement } from "@/types/permissions";

export type PermissionGateProps = PermissionRequirement & {
  children: ReactNode;
  /** Rendered when the user lacks required permissions (default: hide). */
  fallback?: ReactNode;
};

/**
 * Client wrapper: renders children only when the current user satisfies
 * the permission requirement (empty/omitted permissions => allow).
 */
export function PermissionGate({
  children,
  fallback = null,
  permissions,
  permissionMode,
}: PermissionGateProps) {
  const allowed = useSatisfiesPermissions({ permissions, permissionMode });
  return allowed ? children : fallback;
}
