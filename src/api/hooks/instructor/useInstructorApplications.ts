"use client";

import {
  getInstructorApplicationDetailKey,
  getInstructorApplicationService,
  getInstructorApplicationsListKey,
  listInstructorApplicationsService,
} from "@/api/callers/instructor";
import { useApiDetailQuery, useApiListQuery } from "@/api/hooks/shared";
import type {
  InstructorApplication,
  InstructorListFilters,
} from "@/types/instructor";

export function useInstructorApplicationsList(filters: InstructorListFilters) {
  return useApiListQuery<InstructorApplication>(
    getInstructorApplicationsListKey(filters),
    () => listInstructorApplicationsService(filters),
    { revalidateOnFocus: true },
  );
}

export function useInstructorApplicationDetail(
  applicationId: string | null,
  locale?: string,
) {
  return useApiDetailQuery<InstructorApplication>(
    applicationId
      ? getInstructorApplicationDetailKey(applicationId, locale)
      : null,
    () => getInstructorApplicationService(applicationId as string, locale),
    { revalidateOnFocus: false },
  );
}
