"use client";

import useSWR from "swr";
import {
  getInstructorApplicationsListKey,
  listInstructorApplicationsService,
} from "@/api/callers/instructor";
import type { ApiPaginatedData } from "@/types/api";
import type {
  InstructorApplication,
  InstructorListFilters,
} from "@/types/instructor";

export function useInstructorApplicationsList(filters: InstructorListFilters) {
  const key = getInstructorApplicationsListKey(filters);
  const swr = useSWR<ApiPaginatedData<InstructorApplication[]>>(
    key,
    () => listInstructorApplicationsService(filters),
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
