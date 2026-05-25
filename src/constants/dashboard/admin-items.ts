import { BookOpen, LayoutDashboard, Users } from "lucide-react";
import { PERMISSIONS } from "@/constants/permissions";
import type { DashboardItem } from "@/types/dashboard";

export const ADMIN_DASHBOARD_ITEMS: DashboardItem[] = [
  {
    id: "admin-overview",
    title: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
    permissions: [PERMISSIONS.AdminModify],
  },
  {
    id: "admin-users",
    title: "Users",
    icon: Users,
    permissions: [PERMISSIONS.UserRead],
    children: [
      {
        id: "admin-users-all",
        title: "All Users",
        href: "/admin/users",
        icon: Users,
        permissions: [PERMISSIONS.UserRead],
      },
    ],
  },
  {
    id: "admin-courses",
    title: "Courses",
    href: "/admin/courses",
    icon: BookOpen,
    permissions: [PERMISSIONS.CourseRead],
  },
];
