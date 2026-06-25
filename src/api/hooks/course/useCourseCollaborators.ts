"use client";

import {
  getCourseCollaboratorsKey,
  listCourseCollaboratorsService,
} from "@/api/callers/course";
import { useApiListQuery } from "@/api/hooks/shared";
import type {
  CourseCollaborator,
  CourseCollaboratorListFilters,
} from "@/types/course";

export function useCourseCollaborators(
  courseId: string | null,
  filters: CourseCollaboratorListFilters,
) {
  return useApiListQuery<CourseCollaborator>(
    courseId ? getCourseCollaboratorsKey(courseId, filters) : null,
    () => listCourseCollaboratorsService(courseId as string, filters),
    { revalidateOnFocus: true },
  );
}
