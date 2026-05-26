import { BookOpen, LayoutDashboard, Users } from "lucide-react";
import { TAXONOMY_MENU_ICONS } from "@/constants/dashboard/taxonomy-icons";
import { PERMISSIONS } from "@/constants/permissions";
import { TAXONOMY_GROUP_READ_PERMISSIONS } from "@/constants/taxonomy/resources";
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
  {
    id: "admin-taxonomy",
    title: "Taxonomy",
    titleKey: "taxonomy.menu.group",
    icon: TAXONOMY_MENU_ICONS.group,
    permissions: TAXONOMY_GROUP_READ_PERMISSIONS,
    permissionMode: "any",
    children: [
      {
        id: "admin-taxonomy-levels",
        title: "Course levels",
        titleKey: "taxonomy.menu.levels",
        href: "/admin/taxonomy/levels",
        icon: TAXONOMY_MENU_ICONS.levels,
        permissions: [PERMISSIONS.CourseLevelRead],
      },
      {
        id: "admin-taxonomy-topics",
        title: "Topics",
        titleKey: "taxonomy.menu.topics",
        href: "/admin/taxonomy/topics",
        icon: TAXONOMY_MENU_ICONS.topics,
        permissions: [PERMISSIONS.TopicRead],
      },
      {
        id: "admin-taxonomy-outcomes",
        title: "Outcomes",
        titleKey: "taxonomy.menu.outcomes",
        href: "/admin/taxonomy/outcomes",
        icon: TAXONOMY_MENU_ICONS.outcomes,
        permissions: [PERMISSIONS.CourseOutcomeRead],
      },
      {
        id: "admin-taxonomy-skills",
        title: "Skills",
        titleKey: "taxonomy.menu.skills",
        href: "/admin/taxonomy/skills",
        icon: TAXONOMY_MENU_ICONS.skills,
        permissions: [PERMISSIONS.CourseSkillRead],
      },
      {
        id: "admin-taxonomy-tags",
        title: "Tags",
        titleKey: "taxonomy.menu.tags",
        href: "/admin/taxonomy/tags",
        icon: TAXONOMY_MENU_ICONS.tags,
        permissions: [PERMISSIONS.TagRead],
      },
    ],
  },
];
