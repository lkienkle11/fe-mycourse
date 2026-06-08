"use client";

import {
  getInstructorApplicationsListKey,
  listInstructorApplicationsService,
} from "@/api/callers/instructor";
import { useApiListQuery } from "@/api/hooks/shared";
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
