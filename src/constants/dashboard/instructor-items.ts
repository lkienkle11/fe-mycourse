import { BookOpen, Film, LayoutDashboard } from "lucide-react";
import { INSTRUCTOR_MENU_ICONS } from "@/constants/dashboard/instructor-icons";
import { PERMISSIONS } from "@/constants/permissions";
import {
  instructorCoursesHref,
  instructorMediaHref,
  instructorRootHref,
  instructorTicketsHref,
} from "@/lib/navigation/routes";
import type { DashboardItem } from "@/types/dashboard";

export const INSTRUCTOR_DASHBOARD_ITEMS: DashboardItem[] = [
  {
    id: "instructor-overview",
    title: "Overview",
    titleKey: "instructor.menu.overview",
    href: instructorRootHref,
    icon: LayoutDashboard,
    permissions: [PERMISSIONS.InstructorModify],
  },
  {
    id: "instructor-courses",
    title: "My Courses",
    titleKey: "instructor.menu.courses",
    icon: BookOpen,
    permissions: [PERMISSIONS.CourseInstructorRead],
    children: [
      {
        id: "instructor-courses-list",
        title: "Course List",
        titleKey: "instructor.menu.courseList",
        href: instructorCoursesHref,
        icon: BookOpen,
        permissions: [PERMISSIONS.CourseInstructorRead],
      },
    ],
  },
  {
    id: "instructor-media",
    title: "Media",
    titleKey: "instructor.menu.media",
    href: instructorMediaHref,
    icon: Film,
    permissions: [PERMISSIONS.MediaFileRead],
  },
  {
    id: "instructor-tickets",
    title: "Support tickets",
    titleKey: "instructor.menu.tickets",
    href: instructorTicketsHref,
    icon: INSTRUCTOR_MENU_ICONS.tickets,
    permissions: [PERMISSIONS.InstructorApplicationRead],
  },
];
