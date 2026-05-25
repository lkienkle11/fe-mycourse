"use client";

import type { ReactNode } from "react";
import { DashboardLayout } from "@/components/common/dashboard";
import { ADMIN_DASHBOARD_ITEMS } from "@/constants/dashboard";
import { PERMISSIONS } from "@/constants/permissions";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <DashboardLayout
      items={ADMIN_DASHBOARD_ITEMS}
      permissions={[PERMISSIONS.AdminModify]}
    >
      {children}
    </DashboardLayout>
  );
}
