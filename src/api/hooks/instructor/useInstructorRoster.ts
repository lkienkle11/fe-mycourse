"use client";

import {
  getInstructorRosterListKey,
  listInstructorRosterService,
} from "@/api/callers/instructor";
import { useApiListQuery } from "@/api/hooks/shared";
import type {
  InstructorListFilters,
  InstructorRosterMember,
} from "@/types/instructor";

export function useInstructorRosterList(filters: InstructorListFilters | null) {
  return useApiListQuery<InstructorRosterMember>(
    filters ? getInstructorRosterListKey(filters) : null,
    () => listInstructorRosterService(filters as InstructorListFilters),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000,
    },
  );
}
