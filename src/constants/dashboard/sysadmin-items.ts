import { LayoutDashboard, Server, Shield } from "lucide-react";
import { TAXONOMY_MENU_ICONS } from "@/constants/dashboard/taxonomy-icons";
import { PERMISSIONS } from "@/constants/permissions";
import { TAXONOMY_GROUP_READ_PERMISSIONS } from "@/constants/taxonomy/resources";
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
  {
    id: "sysadmin-taxonomy",
    title: "Taxonomy",
    titleKey: "taxonomy.menu.group",
    icon: TAXONOMY_MENU_ICONS.group,
    permissions: TAXONOMY_GROUP_READ_PERMISSIONS,
    permissionMode: "any",
    children: [
      {
        id: "sysadmin-taxonomy-levels",
        title: "Course levels",
        titleKey: "taxonomy.menu.levels",
        href: "/sysadmin/taxonomy/levels",
        icon: TAXONOMY_MENU_ICONS.levels,
        permissions: [PERMISSIONS.CourseLevelRead],
      },
      {
        id: "sysadmin-taxonomy-topics",
        title: "Topics",
        titleKey: "taxonomy.menu.topics",
        href: "/sysadmin/taxonomy/topics",
        icon: TAXONOMY_MENU_ICONS.topics,
        permissions: [PERMISSIONS.TopicRead],
      },
      {
        id: "sysadmin-taxonomy-outcomes",
        title: "Outcomes",
        titleKey: "taxonomy.menu.outcomes",
        href: "/sysadmin/taxonomy/outcomes",
        icon: TAXONOMY_MENU_ICONS.outcomes,
        permissions: [PERMISSIONS.CourseOutcomeRead],
      },
      {
        id: "sysadmin-taxonomy-skills",
        title: "Skills",
        titleKey: "taxonomy.menu.skills",
        href: "/sysadmin/taxonomy/skills",
        icon: TAXONOMY_MENU_ICONS.skills,
        permissions: [PERMISSIONS.CourseSkillRead],
      },
      {
        id: "sysadmin-taxonomy-tags",
        title: "Tags",
        titleKey: "taxonomy.menu.tags",
        href: "/sysadmin/taxonomy/tags",
        icon: TAXONOMY_MENU_ICONS.tags,
        permissions: [PERMISSIONS.TagRead],
      },
    ],
  },
];
