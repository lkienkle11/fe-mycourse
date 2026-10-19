"use client";

import {
  getAdminCoursesKey,
  getContinueLearningKey,
  getCourseDetailKey,
  getCourseDetailService,
  getCourseReviewQueueKey,
  getEditableCoursesKey,
  getLearningCourseService,
  getTrashedCoursesKey,
  getTrendingCoursesKey,
  listAdminCoursesService,
  listContinueLearningService,
  listEditableCoursesService,
  listPendingCourseReviewsService,
  listPublishedCoursesService,
  listTrashedCoursesService,
  listTrendingCoursesService,
} from "@/api/callers/course";
import { useApiDetailQuery, useApiRowsQuery } from "@/api/hooks/shared";
import type {
  ContinueLearningItem,
  CourseDetail,
  CourseListItem,
  TrendingCourseItem,
} from "@/types/course";

export function useEditableCourses() {
  return useApiRowsQuery<CourseListItem>(
    getEditableCoursesKey(),
    listEditableCoursesService,
    { revalidateOnFocus: true },
  );
}

export function useCourseDetail(
  courseId: string | null,
  options?: { includeOutline?: boolean },
) {
  const includeOutline = options?.includeOutline ?? true;
  return useApiDetailQuery<CourseDetail>(
    courseId ? getCourseDetailKey(courseId, { includeOutline }) : null,
    () =>
      getCourseDetailService(courseId as string, {
        includeOutline,
      }),
    { revalidateOnFocus: true },
  );
}

export function useCourseReviewQueue() {
  return useApiRowsQuery<CourseListItem>(
    getCourseReviewQueueKey(),
    listPendingCourseReviewsService,
    { revalidateOnFocus: true },
  );
}

export function usePublishedCourses() {
  return useApiRowsQuery<CourseListItem>(
    "published-courses",
    listPublishedCoursesService,
    { revalidateOnFocus: true },
  );
}

export function useLearningCourse(courseId: string | null) {
  return useApiDetailQuery<CourseDetail>(
    courseId ? `learning-course-${courseId}` : null,
    () => getLearningCourseService(courseId as string),
    { revalidateOnFocus: true },
  );
}

export function useAdminCourses() {
  return useApiRowsQuery<CourseListItem>(
    getAdminCoursesKey(),
    listAdminCoursesService,
    { revalidateOnFocus: true },
  );
}

export function useTrashedCourses() {
  return useApiRowsQuery<CourseListItem>(
    getTrashedCoursesKey(),
    listTrashedCoursesService,
    { revalidateOnFocus: true },
  );
}

export function useTrendingCourses(limit: number) {
  return useApiRowsQuery<TrendingCourseItem>(
    getTrendingCoursesKey(limit),
    () => listTrendingCoursesService(limit),
    // Public data: keep showing the shorter list while the expanded one loads.
    { keepPreviousData: true },
  );
}

/**
 * `userId` must be the signed-in user's id when that user may read courses and `null`
 * otherwise (a `null` key disables the fetch); it also scopes the SWR cache entry per user.
 */
export function useContinueLearning(limit: number, userId: string | null) {
  return useApiRowsQuery<ContinueLearningItem>(
    userId ? getContinueLearningKey(limit, userId) : null,
    () => listContinueLearningService(limit),
  );
}
