"use client";

import type { ReactNode } from "react";
import { RoleDashboardLayout } from "@/components/common/dashboard";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <RoleDashboardLayout dashboardRole="admin">{children}</RoleDashboardLayout>
  );
}
