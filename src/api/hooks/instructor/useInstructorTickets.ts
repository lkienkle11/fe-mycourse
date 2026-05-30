"use client";

import useSWR from "swr";
import {
  getInstructorTicketMessagesKey,
  getInstructorTicketsListKey,
  listInstructorTicketMessagesService,
  listInstructorTicketsService,
} from "@/api/callers/instructor";
import type { ApiPaginatedData } from "@/types/api";
import type {
  InstructorTicket,
  InstructorTicketListFilters,
  InstructorTicketMessage,
} from "@/types/instructor";

export function useInstructorTicketsList(filters: InstructorTicketListFilters) {
  const key = getInstructorTicketsListKey(filters);
  const swr = useSWR<ApiPaginatedData<InstructorTicket[]>>(
    key,
    () => listInstructorTicketsService(filters),
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

export function useInstructorTicketMessages(ticketId: number | null) {
  const key = ticketId ? getInstructorTicketMessagesKey(ticketId) : null;
  const swr = useSWR<InstructorTicketMessage[]>(
    key,
    () => listInstructorTicketMessagesService(ticketId as number),
    { revalidateOnFocus: true },
  );
  return {
    rows: swr.data ?? [],
    isLoading: swr.isLoading,
    error: swr.error,
    mutate: swr.mutate,
  };
}
