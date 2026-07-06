"use client";

import {
  getInstructorProfileByUserService,
  getInstructorProfileDetailKey,
  getInstructorProfilesListKey,
  listInstructorProfilesService,
} from "@/api/callers/instructor";
import { useApiDetailQuery, useApiListQuery } from "@/api/hooks/shared";
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

export function useInstructorProfileDetail(
  userId: string | null,
  options?: Parameters<typeof useApiDetailQuery<InstructorProfile>>[2],
) {
  return useApiDetailQuery<InstructorProfile>(
    userId ? getInstructorProfileDetailKey(userId) : null,
    () => getInstructorProfileByUserService(userId as string),
    { revalidateOnFocus: false, ...options },
  );
}
