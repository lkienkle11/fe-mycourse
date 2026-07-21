/**
 * Instructor application callers (isomorphic factory slice).
 */

import { isApiHttpError } from "@/api/core/fetch-error";
import type { ApiMethods } from "@/api/core/methods";
import { API_PRIVATE_ROUTES } from "@/constants/api-route";
import { buildQueryParams } from "@/lib/utils";
import type {
  ApiPaginatedData,
  ApiPaginatedResponse,
  ApiResponse,
} from "@/types/api";
import type {
  ContactInstructorAdminPayload,
  ContactInstructorAdminResponse,
  InstructorApplication,
  InstructorListFilters,
  MyInstructorApplication,
  RejectApplicationPayload,
  SubmitInstructorApplicationPayload,
} from "@/types/instructor";
import {
  getInstructorApplicationDetailKey,
  getInstructorApplicationsListKey,
  getMyInstructorApplicationKey,
} from "./instructor-factory-keys";

const routes = API_PRIVATE_ROUTES.instructor;

export function createInstructorApplicationCallers(methods: ApiMethods) {
  async function getMyInstructorApplicationService(
    locale?: string,
  ): Promise<MyInstructorApplication | null> {
    try {
      const { data } = await methods.apiFetch<
        ApiResponse<MyInstructorApplication>
      >(getMyInstructorApplicationKey(locale));
      return data.data ?? null;
    } catch (error) {
      if (isApiHttpError(error) && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async function submitInstructorApplicationService(
    payload: SubmitInstructorApplicationPayload,
    locale?: string,
  ): Promise<MyInstructorApplication> {
    const query: Record<string, string> = {};
    if (locale) query.locale = locale;
    const url =
      buildQueryParams(
        routes.applications,
        Object.keys(query).length > 0 ? query : undefined,
      ) ?? routes.applications;
    const { data } = await methods.apiPost<
      ApiResponse<MyInstructorApplication>,
      SubmitInstructorApplicationPayload
    >(url, payload);
    if (!data.data) {
      throw new Error(data.message || "Failed to submit application");
    }
    return data.data;
  }

  async function resubmitInstructorApplicationService(
    payload: SubmitInstructorApplicationPayload,
    locale?: string,
  ): Promise<MyInstructorApplication> {
    const query: Record<string, string> = {};
    if (locale) query.locale = locale;
    const url =
      buildQueryParams(
        routes.applicationMe,
        Object.keys(query).length > 0 ? query : undefined,
      ) ?? routes.applicationMe;
    const { data } = await methods.apiPut<
      ApiResponse<MyInstructorApplication>,
      SubmitInstructorApplicationPayload
    >(url, payload);
    if (!data.data) {
      throw new Error(data.message || "Failed to resubmit application");
    }
    return data.data;
  }

  async function contactInstructorAdminService(
    payload: ContactInstructorAdminPayload,
  ): Promise<ContactInstructorAdminResponse> {
    const { data } = await methods.apiPost<
      ApiResponse<ContactInstructorAdminResponse>,
      ContactInstructorAdminPayload
    >(routes.applicationContactAdmin, payload);
    if (!data.data) {
      throw new Error(data.message || "Failed to contact admin");
    }
    return data.data;
  }

  async function listInstructorApplicationsService(
    filters: InstructorListFilters = {},
  ): Promise<ApiPaginatedData<InstructorApplication[]>> {
    const url = getInstructorApplicationsListKey(filters);
    if (!url) throw new Error("Invalid applications list URL");
    const { data } =
      await methods.apiFetch<ApiPaginatedResponse<InstructorApplication[]>>(
        url,
      );
    if (!data.data)
      throw new Error(data.message || "Failed to load applications");
    return data.data;
  }

  async function getInstructorApplicationService(
    id: string,
    locale?: string,
  ): Promise<InstructorApplication> {
    const { data } = await methods.apiFetch<ApiResponse<InstructorApplication>>(
      getInstructorApplicationDetailKey(id, locale),
    );
    if (!data.data)
      throw new Error(data.message || "Failed to load application");
    return data.data;
  }

  async function approveInstructorApplicationService(
    id: string,
    locale?: string,
  ): Promise<InstructorApplication> {
    const query: Record<string, string> = {};
    if (locale) query.locale = locale;
    const url = buildQueryParams(
      routes.applicationApprove,
      Object.keys(query).length > 0 ? query : undefined,
      {
        id: String(id),
      },
    );
    if (!url) throw new Error("Invalid approve URL");
    const { data } = await methods.apiPost<ApiResponse<InstructorApplication>>(
      url,
      {},
    );
    if (!data.data) throw new Error(data.message || "Failed to approve");
    return data.data;
  }

  async function rejectInstructorApplicationService(
    id: string,
    payload: RejectApplicationPayload,
    locale?: string,
  ): Promise<InstructorApplication> {
    const query: Record<string, string> = {};
    if (locale) query.locale = locale;
    const url = buildQueryParams(
      routes.applicationReject,
      Object.keys(query).length > 0 ? query : undefined,
      {
        id: String(id),
      },
    );
    if (!url) throw new Error("Invalid reject URL");
    const { data } = await methods.apiPost<
      ApiResponse<InstructorApplication>,
      RejectApplicationPayload
    >(url, payload);
    if (!data.data) throw new Error(data.message || "Failed to reject");
    return data.data;
  }

  async function deleteInstructorApplicationService(id: string): Promise<void> {
    const url = buildQueryParams(routes.applicationById, undefined, {
      id: String(id),
    });
    if (!url) throw new Error("Invalid application delete URL");
    await methods.apiDelete<ApiResponse<null>>(url);
  }

  return {
    getMyInstructorApplicationService,
    submitInstructorApplicationService,
    resubmitInstructorApplicationService,
    contactInstructorAdminService,
    listInstructorApplicationsService,
    getInstructorApplicationService,
    approveInstructorApplicationService,
    rejectInstructorApplicationService,
    deleteInstructorApplicationService,
  };
}
