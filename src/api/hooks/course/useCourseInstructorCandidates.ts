"use client";

import {
  getCourseInstructorCandidatesKey,
  listCourseInstructorCandidatesService,
} from "@/api/callers/course";
import { useApiListQuery } from "@/api/hooks/shared";
import type {
  CourseInstructorCandidate,
  CourseInstructorCandidateFilters,
} from "@/types/course";

export function useCourseInstructorCandidates(
  courseId: string | null,
  filters: CourseInstructorCandidateFilters,
  enabled = true,
) {
  return useApiListQuery<CourseInstructorCandidate>(
    courseId && enabled
      ? getCourseInstructorCandidatesKey(courseId, filters)
      : null,
    () => listCourseInstructorCandidatesService(courseId as string, filters),
    { revalidateOnFocus: false },
  );
}
