"use client";

import type { ReactNode } from "react";
import { DashboardLayout } from "@/components/common/dashboard";
import { SYSADMIN_DASHBOARD_ITEMS } from "@/constants/dashboard";
import { PERMISSIONS } from "@/constants/permissions";

type SysadminLayoutProps = {
  children: ReactNode;
};

export default function SysadminLayout({ children }: SysadminLayoutProps) {
  return (
    <DashboardLayout
      items={SYSADMIN_DASHBOARD_ITEMS}
      permissions={[PERMISSIONS.SysadminModify]}
    >
      {children}
    </DashboardLayout>
  );
}
