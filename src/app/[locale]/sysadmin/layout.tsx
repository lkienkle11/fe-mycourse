"use client";

import type { ReactNode } from "react";
import { RoleDashboardLayout } from "@/components/common/dashboard";

type SysadminLayoutProps = {
  children: ReactNode;
};

export default function SysadminLayout({ children }: SysadminLayoutProps) {
  return (
    <RoleDashboardLayout dashboardRole="sysadmin">
      {children}
    </RoleDashboardLayout>
  );
}
