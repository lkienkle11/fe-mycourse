"use client";

import type { ReactNode } from "react";
import { DashboardLayout } from "@/components/common/dashboard";
import { INSTRUCTOR_DASHBOARD_ITEMS } from "@/constants/dashboard";
import { PERMISSIONS } from "@/constants/permissions";

type InstructorLayoutProps = {
  children: ReactNode;
};

export default function InstructorLayout({ children }: InstructorLayoutProps) {
  return (
    <DashboardLayout
      items={INSTRUCTOR_DASHBOARD_ITEMS}
      permissions={[PERMISSIONS.InstructorModify]}
    >
      {children}
    </DashboardLayout>
  );
}
