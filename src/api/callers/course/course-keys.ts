/**
 * Course URL / SWR key helpers (no transport binding).
 */

import { API_PRIVATE_ROUTES } from "@/constants/api-route";
import { buildQueryParams } from "@/lib/utils";
import { apiListQueryToRecord } from "@/lib/utils/list-query";
import type {
  CourseCollaboratorListFilters,
  CourseInstructorCandidateFilters,
  CourseReviewHistoryFilters,
} from "@/types/course";

const routes = API_PRIVATE_ROUTES.course;

export function requireUrl(
  value: string | null | undefined,
  label: string,
): string {
  if (!value) {
    throw new Error(`${label} is required`);
  }
  return value;
}

export function courseUrl(
  path: string,
  courseId: string,
  extra?: Record<string, string>,
): string {
  return requireUrl(
    buildQueryParams(path, undefined, {
      courseId: String(courseId),
      ...extra,
    }),
    "Invalid course URL",
  );
}

export function getEditableCoursesKey(): string {
  return routes.editableList;
}

export function getCourseDetailKey(
  courseId: string,
  options?: { includeOutline?: boolean },
): string {
  const query: Record<string, string> = {};
  if (options?.includeOutline === false) {
    query.include_outline = "false";
  }
  return requireUrl(
    buildQueryParams(routes.byId, query, { courseId: String(courseId) }),
    "Invalid course URL",
  );
}

export function getCourseCollaboratorsKey(
  courseId: string,
  filters: CourseCollaboratorListFilters = {},
): string | null {
  return buildQueryParams(routes.collaborators, apiListQueryToRecord(filters), {
    courseId: String(courseId),
  });
}

export function getCourseInstructorCandidatesKey(
  courseId: string,
  filters: CourseInstructorCandidateFilters = {},
): string | null {
  return buildQueryParams(
    routes.instructorCandidates,
    apiListQueryToRecord(filters),
    { courseId: String(courseId) },
  );
}

export function getCourseReviewQueueKey(): string {
  return routes.pendingReviews;
}

export function getCourseReviewHistoryKey(
  courseId: string,
  filters: CourseReviewHistoryFilters = {},
): string | null {
  const query: Record<string, string> = {};
  if (filters.page != null) {
    query.page = String(filters.page);
  }
  if (filters.per_page != null) {
    query.per_page = String(filters.per_page);
  }
  if (filters.status) {
    query.status = filters.status;
  }
  return buildQueryParams(routes.reviewHistory, query, {
    courseId: String(courseId),
  });
}

export function getAdminCoursesKey(): string {
  return routes.adminCourses;
}

export function getTrashedCoursesKey(): string {
  return routes.adminCoursesTrash;
}
