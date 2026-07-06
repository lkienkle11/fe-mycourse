import {
  adminCoursesAllHref,
  adminCoursesReviewingHref,
  adminCoursesTrashHref,
  adminInstructorsApprovalsHref,
  adminInstructorsExpertiseHref,
  adminInstructorsRosterHref,
  adminInstructorsTicketsHref,
  adminRootHref,
  adminTaxonomyLevelsHref,
  adminTaxonomyOutcomesHref,
  adminTaxonomySkillsHref,
  adminTaxonomyTagsHref,
  adminTaxonomyTopicsHref,
  instructorCoursesHref,
  instructorRootHref,
  instructorTicketsHref,
  sysadminCoursesAllHref,
  sysadminCoursesReviewingHref,
  sysadminCoursesTrashHref,
  sysadminInstructorsApprovalsHref,
  sysadminInstructorsExpertiseHref,
  sysadminInstructorsRosterHref,
  sysadminInstructorsTicketsHref,
  sysadminRootHref,
  sysadminTaxonomyLevelsHref,
  sysadminTaxonomyOutcomesHref,
  sysadminTaxonomySkillsHref,
  sysadminTaxonomyTagsHref,
  sysadminTaxonomyTopicsHref,
} from "@/lib/navigation/routes";
import type {
  DashboardHeaderRouteEntry,
  DashboardRole,
  DashboardRoleRoot,
} from "@/types/dashboard";

export const DASHBOARD_ROLE_ROOT: Record<DashboardRole, DashboardRoleRoot> = {
  admin: {
    href: adminRootHref,
    titleKey: "dashboard.admin.title",
    descriptionKey: "dashboard.admin.description",
  },
  instructor: {
    href: instructorRootHref,
    titleKey: "dashboard.instructor.title",
    descriptionKey: "dashboard.instructor.description",
  },
  sysadmin: {
    href: sysadminRootHref,
    titleKey: "dashboard.sysadmin.title",
    descriptionKey: "dashboard.sysadmin.description",
  },
};

/**
 * Static route metadata for the dashboard page header.
 * Breadcrumbs are derived automatically from the role nav tree (`*DASHBOARD_ITEMS`)
 * by matching each route's href against sidebar item links. Only regex/dynamic
 * routes need an explicit `breadcrumbHref` anchor.
 */
export const DASHBOARD_PAGE_HEADER_ROUTES: DashboardHeaderRouteEntry[] = [
  {
    match: adminRootHref,
    titleKey: DASHBOARD_ROLE_ROOT.admin.titleKey,
    descriptionKey: DASHBOARD_ROLE_ROOT.admin.descriptionKey,
  },
  {
    match: instructorRootHref,
    titleKey: DASHBOARD_ROLE_ROOT.instructor.titleKey,
    descriptionKey: DASHBOARD_ROLE_ROOT.instructor.descriptionKey,
  },
  {
    match: sysadminRootHref,
    titleKey: DASHBOARD_ROLE_ROOT.sysadmin.titleKey,
    descriptionKey: DASHBOARD_ROLE_ROOT.sysadmin.descriptionKey,
  },
  {
    match: instructorCoursesHref,
    titleKey: "course.list.title",
    descriptionKey: "course.list.description",
  },
  {
    match:
      /^\/instructor\/courses\/[^/]+\/(info|outline|collaborators|pricing|certificate)$/,
    titleKey: "course.common.loadingCourse",
    breadcrumbHref: instructorCoursesHref,
  },
  {
    match: instructorTicketsHref,
    titleKey: "instructor.tickets.myTitle",
  },
  {
    match: adminCoursesAllHref,
    titleKey: "course.adminAll.title",
    descriptionKey: "course.adminAll.description",
  },
  {
    match: adminCoursesReviewingHref,
    titleKey: "course.review.title.admin",
    descriptionKey: "course.review.description",
  },
  {
    match: adminCoursesTrashHref,
    titleKey: "course.trash.title",
    descriptionKey: "course.trash.description",
  },
  {
    match: sysadminCoursesAllHref,
    titleKey: "course.adminAll.title",
    descriptionKey: "course.adminAll.description",
  },
  {
    match: sysadminCoursesReviewingHref,
    titleKey: "course.review.title.sysadmin",
    descriptionKey: "course.review.description",
  },
  {
    match: sysadminCoursesTrashHref,
    titleKey: "course.trash.title",
    descriptionKey: "course.trash.description",
  },
  {
    match: /^\/sysadmin\/courses\/reviewing\/[^/]+\/preview$/,
    titleKey: "course.review.preview.title",
    breadcrumbHref: sysadminCoursesReviewingHref,
  },
  {
    match: adminTaxonomyLevelsHref,
    titleKey: "taxonomy.resources.levels.title",
  },
  {
    match: adminTaxonomyTopicsHref,
    titleKey: "taxonomy.resources.topics.title",
  },
  {
    match: adminTaxonomyOutcomesHref,
    titleKey: "taxonomy.resources.outcomes.title",
  },
  {
    match: adminTaxonomySkillsHref,
    titleKey: "taxonomy.resources.skills.title",
  },
  {
    match: adminTaxonomyTagsHref,
    titleKey: "taxonomy.resources.tags.title",
  },
  {
    match: sysadminTaxonomyLevelsHref,
    titleKey: "taxonomy.resources.levels.title",
  },
  {
    match: sysadminTaxonomyTopicsHref,
    titleKey: "taxonomy.resources.topics.title",
  },
  {
    match: sysadminTaxonomyOutcomesHref,
    titleKey: "taxonomy.resources.outcomes.title",
  },
  {
    match: sysadminTaxonomySkillsHref,
    titleKey: "taxonomy.resources.skills.title",
  },
  {
    match: sysadminTaxonomyTagsHref,
    titleKey: "taxonomy.resources.tags.title",
  },
  {
    match: adminInstructorsRosterHref,
    titleKey: "instructor.roster.title",
  },
  {
    match: adminInstructorsApprovalsHref,
    titleKey: "instructor.approvals.title",
  },
  {
    match: adminInstructorsExpertiseHref,
    titleKey: "instructor.expertise.title",
    descriptionKey: "instructor.expertise.description",
  },
  {
    match: adminInstructorsTicketsHref,
    titleKey: "instructor.tickets.adminTitle",
  },
  {
    match: sysadminInstructorsRosterHref,
    titleKey: "instructor.roster.title",
  },
  {
    match: sysadminInstructorsApprovalsHref,
    titleKey: "instructor.approvals.title",
  },
  {
    match: sysadminInstructorsExpertiseHref,
    titleKey: "instructor.expertise.title",
    descriptionKey: "instructor.expertise.description",
  },
  {
    match: sysadminInstructorsTicketsHref,
    titleKey: "instructor.tickets.adminTitle",
  },
];
