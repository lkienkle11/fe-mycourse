"use client";

import useSWR from "swr";
import {
  getInstructorProfilesListKey,
  listInstructorProfilesService,
} from "@/api/callers/instructor";
import type { ApiPaginatedData } from "@/types/api";
import type {
  InstructorListFilters,
  InstructorProfile,
} from "@/types/instructor";

export function useInstructorProfilesList(filters: InstructorListFilters) {
  const key = getInstructorProfilesListKey(filters);
  const swr = useSWR<ApiPaginatedData<InstructorProfile[]>>(
    key,
    () => listInstructorProfilesService(filters),
    { revalidateOnFocus: true },
  );
  return {
    data: swr.data,
    rows: swr.data?.result ?? [],
    pageInfo: swr.data?.page_info,
    isLoading: swr.isLoading,
    error: swr.error,
    mutate: swr.mutate,
  };
}
