"use client";

import {
  getInstructorProfilesListKey,
  listInstructorProfilesService,
} from "@/api/callers/instructor";
import { useApiListQuery } from "@/api/hooks/shared";
import type {
  InstructorListFilters,
  InstructorProfile,
} from "@/types/instructor";

export function useInstructorProfilesList(filters: InstructorListFilters) {
  return useApiListQuery<InstructorProfile>(
    getInstructorProfilesListKey(filters),
    () => listInstructorProfilesService(filters),
    { revalidateOnFocus: true },
  );
}
