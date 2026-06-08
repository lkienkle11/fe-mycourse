"use client";

import type { ReactNode } from "react";
import { DashboardLayout } from "@/components/common/dashboard/dashboard-layout";
import {
  ADMIN_DASHBOARD_ITEMS,
  SYSADMIN_DASHBOARD_ITEMS,
} from "@/constants/dashboard";
import { PERMISSIONS } from "@/constants/permissions";

type DashboardRole = "admin" | "sysadmin";

const DASHBOARD_ROLE_CONFIG = {
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
  dashboardRole: DashboardRole;
  children: ReactNode;
}) {
  const config = DASHBOARD_ROLE_CONFIG[dashboardRole];

  return (
    <DashboardLayout items={config.items} permissions={config.permissions}>
      {children}
    </DashboardLayout>
  );
}
