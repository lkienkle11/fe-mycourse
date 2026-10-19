/**
 * Instructor catalog callers (isomorphic factory slice): public popular-instructors list.
 */

import type { ApiMethods } from "@/api/core/methods";
import type { ApiResponse } from "@/types/api";
import type { PopularInstructorItem } from "@/types/instructor";
import { getPopularInstructorsKey } from "./instructor-factory-keys";

export function createInstructorCatalogCallers(methods: ApiMethods) {
  async function listPopularInstructorsService(
    limit?: number,
  ): Promise<PopularInstructorItem[]> {
    const url = getPopularInstructorsKey(limit);
    if (!url) {
      throw new Error("Invalid popular instructors URL");
    }
    const { data } =
      await methods.apiFetch<ApiResponse<PopularInstructorItem[]>>(url);
    return data.data ?? [];
  }

  return { listPopularInstructorsService };
}
