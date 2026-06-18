import {
  PRIVATE_RESOURCE_ROUTES as privateResourceRoutes,
  PRIVATE_ROUTES as privateRoutes,
  PUBLIC_ROUTES as publicRoutes,
} from "@/constants/route";
import { buildQueryParams } from "@/lib/utils/url";
import type { CourseEditorTab } from "@/types/course";

type RouteQuery = Record<string, string>;
type RouteParam = Record<string, string>;
type PublicRoutes = typeof import("@/constants/route").PUBLIC_ROUTES;
type PrivateRoutes = typeof import("@/constants/route").PRIVATE_ROUTES;
type PublicResourceRoutes =
  typeof import("@/constants/route").PUBLIC_RESOURCE_ROUTES;
type PrivateResourceRoutes =
  typeof import("@/constants/route").PRIVATE_RESOURCE_ROUTES;
type RouteValue<T> = T extends string
  ? T
  : { [K in keyof T]: RouteValue<T[K]> }[keyof T];

function buildRoute(
  route: string,
  query?: RouteQuery,
  params?: RouteParam,
  fragment?: string,
): string {
  return buildQueryParams(route, query, params, fragment) ?? route;
}

export function toPublicRoute(
  route: RouteValue<PublicRoutes>,
  query?: RouteQuery,
  fragment?: string,
): string {
  return buildRoute(route, query, undefined, fragment);
}

export function toPrivateRoute(
  route: RouteValue<PrivateRoutes>,
  query?: RouteQuery,
  fragment?: string,
): string {
  return buildRoute(route, query, undefined, fragment);
}

export function toPublicResourceRoute(
  route: RouteValue<PublicResourceRoutes> | string,
  params: RouteParam,
  query?: RouteQuery,
  fragment?: string,
): string {
  return buildRoute(route, query, params, fragment);
}

export function toPrivateResourceRoute(
  route: RouteValue<PrivateResourceRoutes>,
  params: RouteParam,
  query?: RouteQuery,
  fragment?: string,
): string {
  return buildRoute(route, query, params, fragment);
}

export function instructorCourseEditorHref(
  courseId: number | string,
  query?: RouteQuery,
  fragment?: string,
): string {
  return toPrivateResourceRoute(
    privateResourceRoutes.instructor.courseEditor,
    { courseId: String(courseId) },
    query,
    fragment,
  );
}

export function instructorCourseEditorTabHref(
  courseId: number | string,
  tab: CourseEditorTab,
  query?: RouteQuery,
  fragment?: string,
): string {
  return toPrivateResourceRoute(
    privateResourceRoutes.instructor.courseEditorTab,
    { courseId: String(courseId), tab },
    query,
    fragment,
  );
}

export const homeHref = toPublicRoute(publicRoutes.home);
export const forgotPasswordHref = toPublicRoute(publicRoutes.forgotPassword);
export const confirmEmailHref = toPublicRoute(publicRoutes.confirmEmail);
export const logoutHref = toPublicRoute(publicRoutes.logout);

export const adminRootHref = toPrivateRoute(privateRoutes.admin.root);
export const instructorRootHref = toPrivateRoute(privateRoutes.instructor.root);
export const sysadminRootHref = toPrivateRoute(privateRoutes.sysadmin.root);
export const instructorCoursesHref = toPrivateRoute(
  privateRoutes.instructor.courses,
);
export const instructorMediaHref = toPrivateRoute(
  privateRoutes.instructor.media,
);
export const instructorTicketsHref = toPrivateRoute(
  privateRoutes.instructor.tickets,
);

export const adminUsersHref = toPrivateRoute(privateRoutes.admin.users);
export const adminCoursesAllHref = toPrivateRoute(
  privateRoutes.admin.courses.all,
);
export const adminCoursesReviewingHref = toPrivateRoute(
  privateRoutes.admin.courses.reviewing,
);
export const adminCoursesTrashHref = toPrivateRoute(
  privateRoutes.admin.courses.trash,
);
/** @deprecated Use adminCoursesReviewingHref — kept for legacy references */
export const adminCoursesHref = adminCoursesReviewingHref;
export const adminTaxonomyLevelsHref = toPrivateRoute(
  privateRoutes.admin.taxonomy.levels,
);
export const adminTaxonomyTopicsHref = toPrivateRoute(
  privateRoutes.admin.taxonomy.topics,
);
export const adminTaxonomyOutcomesHref = toPrivateRoute(
  privateRoutes.admin.taxonomy.outcomes,
);
export const adminTaxonomySkillsHref = toPrivateRoute(
  privateRoutes.admin.taxonomy.skills,
);
export const adminTaxonomyTagsHref = toPrivateRoute(
  privateRoutes.admin.taxonomy.tags,
);
export const adminInstructorsRosterHref = toPrivateRoute(
  privateRoutes.admin.instructors.roster,
);
export const adminInstructorsApprovalsHref = toPrivateRoute(
  privateRoutes.admin.instructors.approvals,
);
export const adminInstructorsProfilesHref = toPrivateRoute(
  privateRoutes.admin.instructors.profiles,
);
export const adminInstructorsExpertiseHref = toPrivateRoute(
  privateRoutes.admin.instructors.expertise,
);
export const adminInstructorsTicketsHref = toPrivateRoute(
  privateRoutes.admin.instructors.tickets,
);

export const sysadminSystemHref = toPrivateRoute(privateRoutes.sysadmin.system);
export const sysadminRolesHref = toPrivateRoute(privateRoutes.sysadmin.roles);
export const sysadminCoursesAllHref = toPrivateRoute(
  privateRoutes.sysadmin.courses.all,
);
export const sysadminCoursesReviewingHref = toPrivateRoute(
  privateRoutes.sysadmin.courses.reviewing,
);
export const sysadminCoursesTrashHref = toPrivateRoute(
  privateRoutes.sysadmin.courses.trash,
);

export function sysadminCourseReviewPreviewHref(courseId: string): string {
  return toPrivateResourceRoute(
    privateResourceRoutes.sysadmin.courseReviewPreview,
    { courseId },
  );
}
export const sysadminTaxonomyLevelsHref = toPrivateRoute(
  privateRoutes.sysadmin.taxonomy.levels,
);
export const sysadminTaxonomyTopicsHref = toPrivateRoute(
  privateRoutes.sysadmin.taxonomy.topics,
);
export const sysadminTaxonomyOutcomesHref = toPrivateRoute(
  privateRoutes.sysadmin.taxonomy.outcomes,
);
export const sysadminTaxonomySkillsHref = toPrivateRoute(
  privateRoutes.sysadmin.taxonomy.skills,
);
export const sysadminTaxonomyTagsHref = toPrivateRoute(
  privateRoutes.sysadmin.taxonomy.tags,
);
export const sysadminInstructorsRosterHref = toPrivateRoute(
  privateRoutes.sysadmin.instructors.roster,
);
export const sysadminInstructorsApprovalsHref = toPrivateRoute(
  privateRoutes.sysadmin.instructors.approvals,
);
export const sysadminInstructorsProfilesHref = toPrivateRoute(
  privateRoutes.sysadmin.instructors.profiles,
);
export const sysadminInstructorsExpertiseHref = toPrivateRoute(
  privateRoutes.sysadmin.instructors.expertise,
);
export const sysadminInstructorsTicketsHref = toPrivateRoute(
  privateRoutes.sysadmin.instructors.tickets,
);

export const accountMyCoursesHref = toPrivateRoute(
  privateRoutes.account.myCourses,
);
export const accountMyCartHref = toPrivateRoute(privateRoutes.account.myCart);
export const accountWishlistHref = toPrivateRoute(
  privateRoutes.account.wishlist,
);
export const accountNotificationsHref = toPrivateRoute(
  privateRoutes.account.notifications,
);
export const accountSettingsHref = toPrivateRoute(
  privateRoutes.account.accountSettings,
);
