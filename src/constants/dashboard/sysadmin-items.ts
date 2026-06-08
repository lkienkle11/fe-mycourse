import { BookOpen, LayoutDashboard, Server, Shield } from "lucide-react";
import { INSTRUCTOR_MENU_ICONS } from "@/constants/dashboard/instructor-icons";
import { TAXONOMY_MENU_ICONS } from "@/constants/dashboard/taxonomy-icons";
import { INSTRUCTOR_GROUP_READ_PERMISSIONS } from "@/constants/instructor/resources";
import { PERMISSIONS } from "@/constants/permissions";
import { TAXONOMY_GROUP_READ_PERMISSIONS } from "@/constants/taxonomy/resources";
import {
  sysadminCoursesHref,
  sysadminInstructorsApprovalsHref,
  sysadminInstructorsExpertiseHref,
  sysadminInstructorsProfilesHref,
  sysadminInstructorsRosterHref,
  sysadminInstructorsTicketsHref,
  sysadminRolesHref,
  sysadminRootHref,
  sysadminSystemHref,
  sysadminTaxonomyLevelsHref,
  sysadminTaxonomyOutcomesHref,
  sysadminTaxonomySkillsHref,
  sysadminTaxonomyTagsHref,
  sysadminTaxonomyTopicsHref,
} from "@/lib/navigation/routes";
import type { DashboardItem } from "@/types/dashboard";

export const SYSADMIN_DASHBOARD_ITEMS: DashboardItem[] = [
  {
    id: "sysadmin-overview",
    title: "Overview",
    href: sysadminRootHref,
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
        href: sysadminSystemHref,
        icon: Server,
        permissions: [PERMISSIONS.UserRead],
      },
    ],
  },
  {
    id: "sysadmin-roles",
    title: "Roles",
    href: sysadminRolesHref,
    icon: Shield,
    permissions: [PERMISSIONS.SysadminModify],
  },
  {
    id: "sysadmin-courses",
    title: "Courses",
    href: sysadminCoursesHref,
    icon: BookOpen,
    permissions: [PERMISSIONS.CourseRead],
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
        href: sysadminTaxonomyLevelsHref,
        icon: TAXONOMY_MENU_ICONS.levels,
        permissions: [PERMISSIONS.CourseLevelRead],
      },
      {
        id: "sysadmin-taxonomy-topics",
        title: "Topics",
        titleKey: "taxonomy.menu.topics",
        href: sysadminTaxonomyTopicsHref,
        icon: TAXONOMY_MENU_ICONS.topics,
        permissions: [PERMISSIONS.TopicRead],
      },
      {
        id: "sysadmin-taxonomy-outcomes",
        title: "Outcomes",
        titleKey: "taxonomy.menu.outcomes",
        href: sysadminTaxonomyOutcomesHref,
        icon: TAXONOMY_MENU_ICONS.outcomes,
        permissions: [PERMISSIONS.CourseOutcomeRead],
      },
      {
        id: "sysadmin-taxonomy-skills",
        title: "Skills",
        titleKey: "taxonomy.menu.skills",
        href: sysadminTaxonomySkillsHref,
        icon: TAXONOMY_MENU_ICONS.skills,
        permissions: [PERMISSIONS.CourseSkillRead],
      },
      {
        id: "sysadmin-taxonomy-tags",
        title: "Tags",
        titleKey: "taxonomy.menu.tags",
        href: sysadminTaxonomyTagsHref,
        icon: TAXONOMY_MENU_ICONS.tags,
        permissions: [PERMISSIONS.TagRead],
      },
    ],
  },
  {
    id: "sysadmin-instructors",
    title: "Instructors",
    titleKey: "instructor.menu.group",
    icon: INSTRUCTOR_MENU_ICONS.group,
    permissions: INSTRUCTOR_GROUP_READ_PERMISSIONS,
    permissionMode: "any",
    children: [
      {
        id: "sysadmin-instructors-roster",
        title: "Roster",
        titleKey: "instructor.menu.roster",
        href: sysadminInstructorsRosterHref,
        icon: INSTRUCTOR_MENU_ICONS.roster,
        permissions: [PERMISSIONS.InstructorRosterRead],
      },
      {
        id: "sysadmin-instructors-approvals",
        title: "Approvals",
        titleKey: "instructor.menu.approvals",
        href: sysadminInstructorsApprovalsHref,
        icon: INSTRUCTOR_MENU_ICONS.approvals,
        permissions: [PERMISSIONS.InstructorApplicationRead],
      },
      {
        id: "sysadmin-instructors-profiles",
        title: "Profiles",
        titleKey: "instructor.menu.profiles",
        href: sysadminInstructorsProfilesHref,
        icon: INSTRUCTOR_MENU_ICONS.profiles,
        permissions: [PERMISSIONS.InstructorProfileRead],
      },
      {
        id: "sysadmin-instructors-expertise",
        title: "Expertise",
        titleKey: "instructor.menu.expertise",
        href: sysadminInstructorsExpertiseHref,
        icon: INSTRUCTOR_MENU_ICONS.expertise,
        permissions: [PERMISSIONS.InstructorExpertiseRead],
      },
      {
        id: "sysadmin-instructors-tickets",
        title: "Tickets",
        titleKey: "instructor.menu.tickets",
        href: sysadminInstructorsTicketsHref,
        icon: INSTRUCTOR_MENU_ICONS.tickets,
        permissions: [PERMISSIONS.InstructorApplicationRead],
      },
    ],
  },
];
