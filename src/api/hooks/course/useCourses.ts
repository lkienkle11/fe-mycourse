"use client";

import {
  getCourseDetailKey,
  getCourseDetailService,
  getCourseReviewQueueKey,
  getEditableCoursesKey,
  getLearningCourseService,
  listEditableCoursesService,
  listPendingCourseReviewsService,
  listPublishedCoursesService,
} from "@/api/callers/course";
import { useApiDetailQuery, useApiRowsQuery } from "@/api/hooks/shared";
import type { CourseDetail, CourseListItem } from "@/types/course";

export function useEditableCourses() {
  return useApiRowsQuery<CourseListItem>(
    getEditableCoursesKey(),
    listEditableCoursesService,
    { revalidateOnFocus: true },
  );
}

export function useCourseDetail(courseId: string | null) {
  return useApiDetailQuery<CourseDetail>(
    courseId ? getCourseDetailKey(courseId) : null,
    () => getCourseDetailService(courseId as string),
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
