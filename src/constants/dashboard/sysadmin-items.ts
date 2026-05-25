import { LayoutDashboard, Server, Shield } from "lucide-react";
import { PERMISSIONS } from "@/constants/permissions";
import type { DashboardItem } from "@/types/dashboard";

export const SYSADMIN_DASHBOARD_ITEMS: DashboardItem[] = [
  {
    id: "sysadmin-overview",
    title: "Overview",
    href: "/sysadmin",
    icon: LayoutDashboard,
    permissions: [PERMISSIONS.SysadminModify],
  },
  {
    id: "sysadmin-system",
    title: "System",
    icon: Server,
    permissions: [PERMISSIONS.SysadminModify],
    children: [
      {
        id: "sysadmin-system-health",
        title: "Health",
        href: "/sysadmin/system",
        icon: Server,
        permissions: [PERMISSIONS.UserRead],
      },
    ],
  },
  {
    id: "sysadmin-roles",
    title: "Roles",
    href: "/sysadmin/roles",
    icon: Shield,
    permissions: [PERMISSIONS.SysadminModify],
  },
];
