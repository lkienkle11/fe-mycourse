/**
 * Instructor ticket callers (isomorphic factory slice).
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
  AddTicketMessagePayload,
  CreateTicketPayload,
  InstructorTicket,
  InstructorTicketListFilters,
  InstructorTicketMessage,
} from "@/types/instructor";
import {
  getInstructorTicketMessagesKey,
  getInstructorTicketsListKey,
} from "./instructor-factory-keys";

const routes = API_PRIVATE_ROUTES.instructor;

export function createInstructorTicketCallers(methods: ApiMethods) {
  async function listInstructorTicketsService(
    filters: InstructorTicketListFilters = {},
  ): Promise<ApiPaginatedData<InstructorTicket[]>> {
    const url = getInstructorTicketsListKey(filters);
    if (!url) throw new Error("Invalid tickets list URL");
    const { data } =
      await methods.apiFetch<ApiPaginatedResponse<InstructorTicket[]>>(url);
    if (!data.data) throw new Error(data.message || "Failed to load tickets");
    return data.data;
  }

  async function createInstructorTicketService(
    payload: CreateTicketPayload,
  ): Promise<InstructorTicket> {
    const { data } = await methods.apiPost<
      ApiResponse<InstructorTicket>,
      CreateTicketPayload
    >(routes.tickets, payload);
    if (!data.data) throw new Error(data.message || "Failed to create ticket");
    return data.data;
  }

  async function closeInstructorTicketService(id: string): Promise<void> {
    const url = buildQueryParams(routes.ticketClose, undefined, {
      id: String(id),
    });
    if (!url) throw new Error("Invalid close ticket URL");
    await methods.apiPost<ApiResponse<null>>(url, {});
  }

  async function listInstructorTicketMessagesService(
    ticketId: string,
  ): Promise<InstructorTicketMessage[]> {
    const { data } = await methods.apiFetch<
      ApiResponse<InstructorTicketMessage[]>
    >(getInstructorTicketMessagesKey(ticketId));
    if (!data.data) throw new Error(data.message || "Failed to load messages");
    return data.data;
  }

  async function addInstructorTicketMessageService(
    ticketId: string,
    payload: AddTicketMessagePayload,
  ): Promise<InstructorTicketMessage> {
    const url = buildQueryParams(routes.ticketMessages, undefined, {
      id: String(ticketId),
    });
    if (!url) throw new Error("Invalid add message URL");
    const { data } = await methods.apiPost<
      ApiResponse<InstructorTicketMessage>,
      AddTicketMessagePayload
    >(url, payload);
    if (!data.data) throw new Error(data.message || "Failed to add message");
    return data.data;
  }

  return {
    listInstructorTicketsService,
    createInstructorTicketService,
    closeInstructorTicketService,
    listInstructorTicketMessagesService,
    addInstructorTicketMessageService,
  };
}
