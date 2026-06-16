"use client";

import type { ReactNode } from "react";
import { DashboardLayout } from "@/components/common/dashboard/dashboard-layout";
import {
  ADMIN_DASHBOARD_ITEMS,
  SYSADMIN_DASHBOARD_ITEMS,
} from "@/constants/dashboard";
import { PERMISSIONS } from "@/constants/permissions";
import type { DashboardLayoutProps, DashboardRole } from "@/types/dashboard";

type RoleDashboardLayoutRole = Exclude<DashboardRole, "instructor">;

const DASHBOARD_ROLE_CONFIG: Record<
  RoleDashboardLayoutRole,
  {
    items: DashboardLayoutProps["items"];
    permissions: NonNullable<DashboardLayoutProps["permissions"]>;
  }
> = {
  admin: {
    items: ADMIN_DASHBOARD_ITEMS,
    permissions: [PERMISSIONS.AdminModify],
  },
  sysadmin: {
    items: SYSADMIN_DASHBOARD_ITEMS,
    permissions: [PERMISSIONS.SysadminModify],
  },
} as const;

export function RoleDashboardLayout({
  dashboardRole,
  children,
}: {
  dashboardRole: RoleDashboardLayoutRole;
  children: ReactNode;
}) {
  const config = DASHBOARD_ROLE_CONFIG[dashboardRole];

  return (
    <DashboardLayout items={config.items} permissions={config.permissions}>
      {children}
    </DashboardLayout>
  );
}
