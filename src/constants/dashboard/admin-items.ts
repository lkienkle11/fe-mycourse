import { BookOpen, LayoutDashboard, Users } from "lucide-react";
import { INSTRUCTOR_MENU_ICONS } from "@/constants/dashboard/instructor-icons";
import { TAXONOMY_MENU_ICONS } from "@/constants/dashboard/taxonomy-icons";
import { INSTRUCTOR_GROUP_READ_PERMISSIONS } from "@/constants/instructor/resources";
import { PERMISSIONS } from "@/constants/permissions";
import {
  adminCoursesHref,
  adminInstructorsApprovalsHref,
  adminInstructorsExpertiseHref,
  adminInstructorsProfilesHref,
  adminInstructorsRosterHref,
  adminInstructorsTicketsHref,
  adminRootHref,
  adminTaxonomyLevelsHref,
  adminTaxonomyOutcomesHref,
  adminTaxonomySkillsHref,
  adminTaxonomyTagsHref,
  adminTaxonomyTopicsHref,
  adminUsersHref,
} from "@/lib/navigation/routes";
import { TAXONOMY_GROUP_READ_PERMISSIONS } from "@/constants/taxonomy/resources";
import type { DashboardItem } from "@/types/dashboard";

export const ADMIN_DASHBOARD_ITEMS: DashboardItem[] = [
  {
    id: "admin-overview",
    title: "Overview",
    href: adminRootHref,
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
        href: adminUsersHref,
        icon: Users,
        permissions: [PERMISSIONS.UserRead],
      },
    ],
  },
  {
    id: "admin-courses",
    title: "Courses",
    href: adminCoursesHref,
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
        href: adminTaxonomyLevelsHref,
        icon: TAXONOMY_MENU_ICONS.levels,
        permissions: [PERMISSIONS.CourseLevelRead],
      },
      {
        id: "admin-taxonomy-topics",
        title: "Topics",
        titleKey: "taxonomy.menu.topics",
        href: adminTaxonomyTopicsHref,
        icon: TAXONOMY_MENU_ICONS.topics,
        permissions: [PERMISSIONS.TopicRead],
      },
      {
        id: "admin-taxonomy-outcomes",
        title: "Outcomes",
        titleKey: "taxonomy.menu.outcomes",
        href: adminTaxonomyOutcomesHref,
        icon: TAXONOMY_MENU_ICONS.outcomes,
        permissions: [PERMISSIONS.CourseOutcomeRead],
      },
      {
        id: "admin-taxonomy-skills",
        title: "Skills",
        titleKey: "taxonomy.menu.skills",
        href: adminTaxonomySkillsHref,
        icon: TAXONOMY_MENU_ICONS.skills,
        permissions: [PERMISSIONS.CourseSkillRead],
      },
      {
        id: "admin-taxonomy-tags",
        title: "Tags",
        titleKey: "taxonomy.menu.tags",
        href: adminTaxonomyTagsHref,
        icon: TAXONOMY_MENU_ICONS.tags,
        permissions: [PERMISSIONS.TagRead],
      },
    ],
  },
  {
    id: "admin-instructors",
    title: "Instructors",
    titleKey: "instructor.menu.group",
    icon: INSTRUCTOR_MENU_ICONS.group,
    permissions: INSTRUCTOR_GROUP_READ_PERMISSIONS,
    permissionMode: "any",
    children: [
      {
        id: "admin-instructors-roster",
        title: "Roster",
        titleKey: "instructor.menu.roster",
        href: adminInstructorsRosterHref,
        icon: INSTRUCTOR_MENU_ICONS.roster,
        permissions: [PERMISSIONS.InstructorRosterRead],
      },
      {
        id: "admin-instructors-approvals",
        title: "Approvals",
        titleKey: "instructor.menu.approvals",
        href: adminInstructorsApprovalsHref,
        icon: INSTRUCTOR_MENU_ICONS.approvals,
        permissions: [PERMISSIONS.InstructorApplicationRead],
      },
      {
        id: "admin-instructors-profiles",
        title: "Profiles",
        titleKey: "instructor.menu.profiles",
        href: adminInstructorsProfilesHref,
        icon: INSTRUCTOR_MENU_ICONS.profiles,
        permissions: [PERMISSIONS.InstructorProfileRead],
      },
      {
        id: "admin-instructors-expertise",
        title: "Expertise",
        titleKey: "instructor.menu.expertise",
        href: adminInstructorsExpertiseHref,
        icon: INSTRUCTOR_MENU_ICONS.expertise,
        permissions: [PERMISSIONS.InstructorExpertiseRead],
      },
      {
        id: "admin-instructors-tickets",
        title: "Tickets",
        titleKey: "instructor.menu.tickets",
        href: adminInstructorsTicketsHref,
        icon: INSTRUCTOR_MENU_ICONS.tickets,
        permissions: [PERMISSIONS.InstructorApplicationRead],
      },
    ],
  },
];
