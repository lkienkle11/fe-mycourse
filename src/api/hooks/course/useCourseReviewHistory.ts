"use client";

import {
  getCourseReviewHistoryKey,
  listCourseReviewHistoryService,
} from "@/api/callers/course";
import { useApiListQuery } from "@/api/hooks/shared";
import type {
  CourseReviewHistoryFilters,
  CourseReviewHistoryItem,
} from "@/types/course";

export function useCourseReviewHistory(
  courseId: string | null,
  filters: CourseReviewHistoryFilters,
) {
  return useApiListQuery<CourseReviewHistoryItem>(
    courseId ? getCourseReviewHistoryKey(courseId, filters) : null,
    () => listCourseReviewHistoryService(courseId as string, filters),
    { revalidateOnFocus: true },
  );
}
