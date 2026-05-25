import { BookOpen, Film, LayoutDashboard } from "lucide-react";
import { PERMISSIONS } from "@/constants/permissions";
import type { DashboardItem } from "@/types/dashboard";

export const INSTRUCTOR_DASHBOARD_ITEMS: DashboardItem[] = [
  {
    id: "instructor-overview",
    title: "Overview",
    href: "/instructor",
    icon: LayoutDashboard,
    permissions: [PERMISSIONS.InstructorModify],
  },
  {
    id: "instructor-courses",
    title: "My Courses",
    icon: BookOpen,
    permissions: [PERMISSIONS.CourseInstructorRead],
    children: [
      {
        id: "instructor-courses-list",
        title: "Course List",
        href: "/instructor/courses",
        icon: BookOpen,
        permissions: [PERMISSIONS.CourseInstructorRead],
      },
    ],
  },
  {
    id: "instructor-media",
    title: "Media",
    href: "/instructor/media",
    icon: Film,
    permissions: [PERMISSIONS.MediaFileRead],
  },
];
