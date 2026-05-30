"use client";

import useSWR from "swr";
import {
  getInstructorRosterListKey,
  listInstructorRosterService,
} from "@/api/callers/instructor";
import type { ApiPaginatedData } from "@/types/api";
import type {
  InstructorListFilters,
  InstructorRosterMember,
} from "@/types/instructor";

export function useInstructorRosterList(filters: InstructorListFilters) {
  const key = getInstructorRosterListKey(filters);
  const swr = useSWR<ApiPaginatedData<InstructorRosterMember[]>>(
    key,
    () => listInstructorRosterService(filters),
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
