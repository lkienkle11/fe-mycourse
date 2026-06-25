"use client";

import {
  getInstructorRosterCandidatesKey,
  listInstructorRosterCandidatesService,
} from "@/api/callers/instructor";
import { useApiListQuery } from "@/api/hooks/shared";
import type {
  UserPickerCandidate,
  UserPickerFilters,
} from "@/types/user-picker";

export function useInstructorRosterCandidates(
  filters: UserPickerFilters,
  enabled = true,
) {
  return useApiListQuery<UserPickerCandidate>(
    enabled ? getInstructorRosterCandidatesKey(filters) : null,
    () => listInstructorRosterCandidatesService(filters),
    { revalidateOnFocus: false },
  );
}
