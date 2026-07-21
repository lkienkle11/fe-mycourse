/**
 * Instructor roster callers (isomorphic factory slice).
 */

import type { ApiMethods } from "@/api/core/methods";
import { API_PRIVATE_ROUTES } from "@/constants/api-route";
import { buildQueryParams } from "@/lib/utils";
import type {
  ApiPaginatedData,
  ApiPaginatedResponse,
  ApiResponse,
} from "@/types/api";
import type {
  AddRosterBulkPayload,
  AddRosterBulkResult,
  InstructorListFilters,
  InstructorRosterMember,
} from "@/types/instructor";
import type {
  UserPickerCandidate,
  UserPickerFilters,
} from "@/types/user-picker";
import {
  getInstructorRosterCandidatesKey,
  getInstructorRosterListKey,
} from "./instructor-factory-keys";

const routes = API_PRIVATE_ROUTES.instructor;

export function createInstructorRosterCallers(methods: ApiMethods) {
  async function listInstructorRosterCandidatesService(
    filters: UserPickerFilters = {},
  ): Promise<ApiPaginatedData<UserPickerCandidate[]>> {
    const url = getInstructorRosterCandidatesKey(filters);
    if (!url) throw new Error("Invalid roster candidates URL");
    const { data } =
      await methods.apiFetch<ApiPaginatedResponse<UserPickerCandidate[]>>(url);
    if (!data.data) {
      throw new Error(data.message || "Failed to load roster candidates");
    }
    return data.data;
  }

  async function addInstructorRosterBulkService(
    payload: AddRosterBulkPayload,
  ): Promise<AddRosterBulkResult> {
    const { data } = await methods.apiPost<
      ApiResponse<AddRosterBulkResult>,
      AddRosterBulkPayload
    >(routes.rosterBulk, payload);
    if (!data.data) {
      throw new Error(data.message || "Failed to add instructors");
    }
    return data.data;
  }

  async function listInstructorRosterService(
    filters: InstructorListFilters = {},
  ): Promise<ApiPaginatedData<InstructorRosterMember[]>> {
    const url = getInstructorRosterListKey(filters);
    if (!url) throw new Error("Invalid roster list URL");
    const { data } =
      await methods.apiFetch<ApiPaginatedResponse<InstructorRosterMember[]>>(
        url,
      );
    if (!data.data) throw new Error(data.message || "Failed to load roster");
    return data.data;
  }

  async function deleteInstructorRosterService(id: string): Promise<void> {
    const url = buildQueryParams(routes.rosterById, undefined, {
      id: String(id),
    });
    if (!url) throw new Error("Invalid roster delete URL");
    await methods.apiDelete<ApiResponse<null>>(url);
  }

  return {
    listInstructorRosterCandidatesService,
    addInstructorRosterBulkService,
    listInstructorRosterService,
    deleteInstructorRosterService,
  };
}
