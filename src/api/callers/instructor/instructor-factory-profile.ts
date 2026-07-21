/**
 * Instructor profile callers (isomorphic factory slice).
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
  InstructorListFilters,
  InstructorProfile,
  InstructorProfilePayload,
  UpsertProfileResponse,
} from "@/types/instructor";
import { getInstructorProfilesListKey } from "./instructor-factory-keys";

const routes = API_PRIVATE_ROUTES.instructor;

export function createInstructorProfileCallers(methods: ApiMethods) {
  async function listInstructorProfilesService(
    filters: InstructorListFilters = {},
  ): Promise<ApiPaginatedData<InstructorProfile[]>> {
    const url = getInstructorProfilesListKey(filters);
    if (!url) throw new Error("Invalid profiles list URL");
    const { data } =
      await methods.apiFetch<ApiPaginatedResponse<InstructorProfile[]>>(url);
    if (!data.data) throw new Error(data.message || "Failed to load profiles");
    return data.data;
  }

  async function getInstructorProfileByUserService(
    userId: string,
  ): Promise<InstructorProfile> {
    const url = buildQueryParams(routes.profileByUser, undefined, {
      id: String(userId),
    });
    if (!url) throw new Error("Invalid profile URL");
    const { data } =
      await methods.apiFetch<ApiResponse<InstructorProfile>>(url);
    if (!data.data) throw new Error(data.message || "Failed to load profile");
    return data.data;
  }

  async function upsertInstructorProfileService(
    payload: InstructorProfilePayload,
    userId?: string,
  ): Promise<UpsertProfileResponse> {
    if (userId != null) {
      const url = buildQueryParams(routes.profileByUser, undefined, {
        id: String(userId),
      });
      if (!url) throw new Error("Invalid profile update URL");
      const { data } = await methods.apiPatch<
        ApiResponse<UpsertProfileResponse>,
        InstructorProfilePayload
      >(url, payload);
      if (!data.data)
        throw new Error(data.message || "Failed to update profile");
      return data.data;
    }
    const { data } = await methods.apiPost<
      ApiResponse<UpsertProfileResponse>,
      InstructorProfilePayload
    >(routes.profiles, payload);
    if (!data.data) throw new Error(data.message || "Failed to save profile");
    return data.data;
  }

  async function deleteInstructorProfileService(userId: string): Promise<void> {
    const url = buildQueryParams(routes.profileByUser, undefined, {
      id: String(userId),
    });
    if (!url) throw new Error("Invalid profile delete URL");
    await methods.apiDelete<ApiResponse<null>>(url);
  }

  return {
    listInstructorProfilesService,
    getInstructorProfileByUserService,
    upsertInstructorProfileService,
    deleteInstructorProfileService,
  };
}
