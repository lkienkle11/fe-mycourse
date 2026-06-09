"use client";

import {
  getInstructorTicketMessagesKey,
  getInstructorTicketsListKey,
  listInstructorTicketMessagesService,
  listInstructorTicketsService,
} from "@/api/callers/instructor";
import { useApiListQuery, useApiRowsQuery } from "@/api/hooks/shared";
import type {
  InstructorTicket,
  InstructorTicketListFilters,
  InstructorTicketMessage,
} from "@/types/instructor";

export function useInstructorTicketsList(filters: InstructorTicketListFilters) {
  return useApiListQuery<InstructorTicket>(
    getInstructorTicketsListKey(filters),
    () => listInstructorTicketsService(filters),
    { revalidateOnFocus: true },
  );
}

export function useInstructorTicketMessages(ticketId: string | null) {
  return useApiRowsQuery<InstructorTicketMessage>(
    ticketId ? getInstructorTicketMessagesKey(ticketId) : null,
    () => listInstructorTicketMessagesService(ticketId as string),
    { revalidateOnFocus: true },
  );
}
