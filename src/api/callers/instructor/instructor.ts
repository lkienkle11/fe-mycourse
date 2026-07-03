import type { AxiosError } from "axios";
import { apiDelete, apiFetch, apiPatch, apiPost, apiPut } from "@/api/methods";
import { API_PRIVATE_ROUTES } from "@/constants/api-route";
import { apiListQueryToRecord, buildQueryParams } from "@/lib/utils";
import type {
  ApiPaginatedData,
  ApiPaginatedResponse,
  ApiResponse,
} from "@/types/api";
import type {
  AddExpertiseSkillPayload,
  AddExpertiseTopicPayload,
  AddRosterBulkPayload,
  AddRosterBulkResult,
  AddTicketMessagePayload,
  ContactInstructorAdminPayload,
  ContactInstructorAdminResponse,
  CreateTicketPayload,
  InstructorApplication,
  InstructorExpertiseSkill,
  InstructorExpertiseTopic,
  InstructorListFilters,
  InstructorProfile,
  InstructorProfilePayload,
  InstructorRosterMember,
  InstructorTicket,
  InstructorTicketListFilters,
  InstructorTicketMessage,
  MyInstructorApplication,
  RejectApplicationPayload,
  SubmitInstructorApplicationPayload,
  UpsertProfileResponse,
} from "@/types/instructor";
import type {
  UserPickerCandidate,
  UserPickerFilters,
} from "@/types/user-picker";

const routes = API_PRIVATE_ROUTES.instructor;

function listQueryToRecord(
  filters: InstructorListFilters | InstructorTicketListFilters,
): Record<string, string> {
  const query = apiListQueryToRecord(filters);
  if ("review_status" in filters && filters.review_status) {
    query.status = filters.review_status;
  }
  if ("has_profile" in filters && filters.has_profile != null) {
    query.has_profile = String(filters.has_profile);
  }
  if ("scope" in filters && filters.scope === "all") {
    query.scope = "all";
  }
  if ("ticket_status" in filters && filters.ticket_status) {
    query.status = filters.ticket_status;
  }
  return query;
}

export function getInstructorRosterListKey(
  filters: InstructorListFilters = {},
): string | null {
  return buildQueryParams(routes.roster, listQueryToRecord(filters));
}

export function getInstructorRosterCandidatesKey(
  filters: UserPickerFilters = {},
): string | null {
  return buildQueryParams(
    routes.rosterCandidates,
    apiListQueryToRecord(filters),
  );
}

export async function listInstructorRosterCandidatesService(
  filters: UserPickerFilters = {},
): Promise<ApiPaginatedData<UserPickerCandidate[]>> {
  const url = getInstructorRosterCandidatesKey(filters);
  if (!url) throw new Error("Invalid roster candidates URL");
  const { data } =
    await apiFetch<ApiPaginatedResponse<UserPickerCandidate[]>>(url);
  if (!data.data) {
    throw new Error(data.message || "Failed to load roster candidates");
  }
  return data.data;
}

export async function addInstructorRosterBulkService(
  payload: AddRosterBulkPayload,
): Promise<AddRosterBulkResult> {
  const { data } = await apiPost<
    ApiResponse<AddRosterBulkResult>,
    AddRosterBulkPayload
  >(routes.rosterBulk, payload);
  if (!data.data) {
    throw new Error(data.message || "Failed to add instructors");
  }
  return data.data;
}

export async function listInstructorRosterService(
  filters: InstructorListFilters = {},
): Promise<ApiPaginatedData<InstructorRosterMember[]>> {
  const url = getInstructorRosterListKey(filters);
  if (!url) throw new Error("Invalid roster list URL");
  const { data } =
    await apiFetch<ApiPaginatedResponse<InstructorRosterMember[]>>(url);
  if (!data.data) throw new Error(data.message || "Failed to load roster");
  return data.data;
}

export async function deleteInstructorRosterService(id: string): Promise<void> {
  const url = buildQueryParams(routes.rosterById, undefined, {
    id: String(id),
  });
  if (!url) throw new Error("Invalid roster delete URL");
  await apiDelete<ApiResponse<null>>(url);
}

export function getInstructorApplicationsListKey(
  filters: InstructorListFilters = {},
): string | null {
  return buildQueryParams(routes.applications, listQueryToRecord(filters));
}

export function getMyInstructorApplicationKey(): string {
  return routes.applicationMe;
}

export async function getMyInstructorApplicationService(): Promise<MyInstructorApplication | null> {
  try {
    const { data } = await apiFetch<ApiResponse<MyInstructorApplication>>(
      routes.applicationMe,
    );
    return data.data ?? null;
  } catch (error) {
    const axiosError = error as AxiosError<ApiResponse<unknown>>;
    if (axiosError.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function submitInstructorApplicationService(
  payload: SubmitInstructorApplicationPayload,
): Promise<MyInstructorApplication> {
  const { data } = await apiPost<
    ApiResponse<MyInstructorApplication>,
    SubmitInstructorApplicationPayload
  >(routes.applications, payload);
  if (!data.data) {
    throw new Error(data.message || "Failed to submit application");
  }
  return data.data;
}

export async function resubmitInstructorApplicationService(
  payload: SubmitInstructorApplicationPayload,
): Promise<MyInstructorApplication> {
  const { data } = await apiPut<
    ApiResponse<MyInstructorApplication>,
    SubmitInstructorApplicationPayload
  >(routes.applicationMe, payload);
  if (!data.data) {
    throw new Error(data.message || "Failed to resubmit application");
  }
  return data.data;
}

export async function contactInstructorAdminService(
  payload: ContactInstructorAdminPayload,
): Promise<ContactInstructorAdminResponse> {
  const { data } = await apiPost<
    ApiResponse<ContactInstructorAdminResponse>,
    ContactInstructorAdminPayload
  >(routes.applicationContactAdmin, payload);
  if (!data.data) {
    throw new Error(data.message || "Failed to contact admin");
  }
  return data.data;
}

export async function listInstructorApplicationsService(
  filters: InstructorListFilters = {},
): Promise<ApiPaginatedData<InstructorApplication[]>> {
  const url = getInstructorApplicationsListKey(filters);
  if (!url) throw new Error("Invalid applications list URL");
  const { data } =
    await apiFetch<ApiPaginatedResponse<InstructorApplication[]>>(url);
  if (!data.data)
    throw new Error(data.message || "Failed to load applications");
  return data.data;
}

export async function getInstructorApplicationService(
  id: string,
): Promise<InstructorApplication> {
  const url = buildQueryParams(routes.applicationById, undefined, {
    id: String(id),
  });
  if (!url) throw new Error("Invalid application URL");
  const { data } = await apiFetch<ApiResponse<InstructorApplication>>(url);
  if (!data.data) throw new Error(data.message || "Failed to load application");
  return data.data;
}

export async function approveInstructorApplicationService(
  id: string,
): Promise<InstructorApplication> {
  const url = buildQueryParams(routes.applicationApprove, undefined, {
    id: String(id),
  });
  if (!url) throw new Error("Invalid approve URL");
  const { data } = await apiPost<ApiResponse<InstructorApplication>>(url, {});
  if (!data.data) throw new Error(data.message || "Failed to approve");
  return data.data;
}

export async function rejectInstructorApplicationService(
  id: string,
  payload: RejectApplicationPayload,
): Promise<InstructorApplication> {
  const url = buildQueryParams(routes.applicationReject, undefined, {
    id: String(id),
  });
  if (!url) throw new Error("Invalid reject URL");
  const { data } = await apiPost<
    ApiResponse<InstructorApplication>,
    RejectApplicationPayload
  >(url, payload);
  if (!data.data) throw new Error(data.message || "Failed to reject");
  return data.data;
}

export async function deleteInstructorApplicationService(
  id: string,
): Promise<void> {
  const url = buildQueryParams(routes.applicationById, undefined, {
    id: String(id),
  });
  if (!url) throw new Error("Invalid application delete URL");
  await apiDelete<ApiResponse<null>>(url);
}

export function getInstructorProfilesListKey(
  filters: InstructorListFilters = {},
): string | null {
  return buildQueryParams(routes.profiles, listQueryToRecord(filters));
}

export async function listInstructorProfilesService(
  filters: InstructorListFilters = {},
): Promise<ApiPaginatedData<InstructorProfile[]>> {
  const url = getInstructorProfilesListKey(filters);
  if (!url) throw new Error("Invalid profiles list URL");
  const { data } =
    await apiFetch<ApiPaginatedResponse<InstructorProfile[]>>(url);
  if (!data.data) throw new Error(data.message || "Failed to load profiles");
  return data.data;
}

export async function getInstructorProfileByUserService(
  userId: string,
): Promise<InstructorProfile> {
  const url = buildQueryParams(routes.profileByUser, undefined, {
    id: String(userId),
  });
  if (!url) throw new Error("Invalid profile URL");
  const { data } = await apiFetch<ApiResponse<InstructorProfile>>(url);
  if (!data.data) throw new Error(data.message || "Failed to load profile");
  return data.data;
}

export async function upsertInstructorProfileService(
  payload: InstructorProfilePayload,
  userId?: string,
): Promise<UpsertProfileResponse> {
  if (userId != null) {
    const url = buildQueryParams(routes.profileByUser, undefined, {
      id: String(userId),
    });
    if (!url) throw new Error("Invalid profile update URL");
    const { data } = await apiPatch<
      ApiResponse<UpsertProfileResponse>,
      InstructorProfilePayload
    >(url, payload);
    if (!data.data) throw new Error(data.message || "Failed to update profile");
    return data.data;
  }
  const { data } = await apiPost<
    ApiResponse<UpsertProfileResponse>,
    InstructorProfilePayload
  >(routes.profiles, payload);
  if (!data.data) throw new Error(data.message || "Failed to save profile");
  return data.data;
}

export async function deleteInstructorProfileService(
  userId: string,
): Promise<void> {
  const url = buildQueryParams(routes.profileByUser, undefined, {
    id: String(userId),
  });
  if (!url) throw new Error("Invalid profile delete URL");
  await apiDelete<ApiResponse<null>>(url);
}

export function getInstructorExpertiseTopicsKey(instructorId: string): string {
  const url = buildQueryParams(routes.expertiseTopics, undefined, {
    id: String(instructorId),
  });
  if (!url) throw new Error("Invalid expertise topics URL");
  return url;
}

export async function listInstructorExpertiseTopicsService(
  instructorId: string,
): Promise<InstructorExpertiseTopic[]> {
  const { data } = await apiFetch<ApiResponse<InstructorExpertiseTopic[]>>(
    getInstructorExpertiseTopicsKey(instructorId),
  );
  if (!data.data) throw new Error(data.message || "Failed to load topics");
  return data.data;
}

export async function addInstructorExpertiseTopicService(
  instructorId: string,
  payload: AddExpertiseTopicPayload,
): Promise<InstructorExpertiseTopic> {
  const url = buildQueryParams(routes.expertiseTopics, undefined, {
    id: String(instructorId),
  });
  if (!url) throw new Error("Invalid add topic URL");
  const { data } = await apiPost<
    ApiResponse<InstructorExpertiseTopic>,
    AddExpertiseTopicPayload
  >(url, payload);
  if (!data.data) throw new Error(data.message || "Failed to add topic");
  return data.data;
}

export async function deleteInstructorExpertiseTopicService(
  instructorId: string,
  topicRowId: string,
): Promise<void> {
  const url = buildQueryParams(routes.expertiseTopicByRow, undefined, {
    id: String(instructorId),
    topicRowId: String(topicRowId),
  });
  if (!url) throw new Error("Invalid delete topic URL");
  await apiDelete<ApiResponse<null>>(url);
}

export function getInstructorExpertiseSkillsKey(instructorId: string): string {
  const url = buildQueryParams(routes.expertiseSkills, undefined, {
    id: String(instructorId),
  });
  if (!url) throw new Error("Invalid expertise skills URL");
  return url;
}

export async function listInstructorExpertiseSkillsService(
  instructorId: string,
): Promise<InstructorExpertiseSkill[]> {
  const { data } = await apiFetch<ApiResponse<InstructorExpertiseSkill[]>>(
    getInstructorExpertiseSkillsKey(instructorId),
  );
  if (!data.data) throw new Error(data.message || "Failed to load skills");
  return data.data;
}

export async function addInstructorExpertiseSkillService(
  instructorId: string,
  payload: AddExpertiseSkillPayload,
): Promise<InstructorExpertiseSkill> {
  const url = buildQueryParams(routes.expertiseSkills, undefined, {
    id: String(instructorId),
  });
  if (!url) throw new Error("Invalid add skill URL");
  const { data } = await apiPost<
    ApiResponse<InstructorExpertiseSkill>,
    AddExpertiseSkillPayload
  >(url, payload);
  if (!data.data) throw new Error(data.message || "Failed to add skill");
  return data.data;
}

export async function deleteInstructorExpertiseSkillService(
  instructorId: string,
  skillRowId: string,
): Promise<void> {
  const url = buildQueryParams(routes.expertiseSkillByRow, undefined, {
    id: String(instructorId),
    skillRowId: String(skillRowId),
  });
  if (!url) throw new Error("Invalid delete skill URL");
  await apiDelete<ApiResponse<null>>(url);
}

export function getInstructorTicketsListKey(
  filters: InstructorTicketListFilters = {},
): string | null {
  return buildQueryParams(routes.tickets, listQueryToRecord(filters));
}

export async function listInstructorTicketsService(
  filters: InstructorTicketListFilters = {},
): Promise<ApiPaginatedData<InstructorTicket[]>> {
  const url = getInstructorTicketsListKey(filters);
  if (!url) throw new Error("Invalid tickets list URL");
  const { data } =
    await apiFetch<ApiPaginatedResponse<InstructorTicket[]>>(url);
  if (!data.data) throw new Error(data.message || "Failed to load tickets");
  return data.data;
}

export async function createInstructorTicketService(
  payload: CreateTicketPayload,
): Promise<InstructorTicket> {
  const { data } = await apiPost<
    ApiResponse<InstructorTicket>,
    CreateTicketPayload
  >(routes.tickets, payload);
  if (!data.data) throw new Error(data.message || "Failed to create ticket");
  return data.data;
}

export async function closeInstructorTicketService(id: string): Promise<void> {
  const url = buildQueryParams(routes.ticketClose, undefined, {
    id: String(id),
  });
  if (!url) throw new Error("Invalid close ticket URL");
  await apiPost<ApiResponse<null>>(url, {});
}

export function getInstructorTicketMessagesKey(ticketId: string): string {
  const url = buildQueryParams(routes.ticketMessages, undefined, {
    id: String(ticketId),
  });
  if (!url) throw new Error("Invalid ticket messages URL");
  return url;
}

export async function listInstructorTicketMessagesService(
  ticketId: string,
): Promise<InstructorTicketMessage[]> {
  const { data } = await apiFetch<ApiResponse<InstructorTicketMessage[]>>(
    getInstructorTicketMessagesKey(ticketId),
  );
  if (!data.data) throw new Error(data.message || "Failed to load messages");
  return data.data;
}

export async function addInstructorTicketMessageService(
  ticketId: string,
  payload: AddTicketMessagePayload,
): Promise<InstructorTicketMessage> {
  const url = buildQueryParams(routes.ticketMessages, undefined, {
    id: String(ticketId),
  });
  if (!url) throw new Error("Invalid add message URL");
  const { data } = await apiPost<
    ApiResponse<InstructorTicketMessage>,
    AddTicketMessagePayload
  >(url, payload);
  if (!data.data) throw new Error(data.message || "Failed to add message");
  return data.data;
}
