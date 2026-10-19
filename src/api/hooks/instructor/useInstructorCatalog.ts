"use client";

import {
  getPopularInstructorsKey,
  listPopularInstructorsService,
} from "@/api/callers/instructor";
import { useApiRowsQuery } from "@/api/hooks/shared";
import type { PopularInstructorItem } from "@/types/instructor";

export function usePopularInstructors(limit: number) {
  return useApiRowsQuery<PopularInstructorItem>(
    getPopularInstructorsKey(limit),
    () => listPopularInstructorsService(limit),
  );
}
