/** Instructor SWR/query keys + list query helpers. */
import { API_PRIVATE_ROUTES } from "@/constants/api-route";
import { apiListQueryToRecord, buildQueryParams } from "@/lib/utils";
import type {
  InstructorListFilters,
  InstructorTicketListFilters,
} from "@/types/instructor";
import type { UserPickerFilters } from "@/types/user-picker";

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

export function getInstructorApplicationsListKey(
  filters: InstructorListFilters = {},
): string | null {
  return buildQueryParams(routes.applications, listQueryToRecord(filters));
}

export function getMyInstructorApplicationKey(locale?: string): string {
  const query: Record<string, string> = {};
  if (locale) query.locale = locale;
  const url = buildQueryParams(
    routes.applicationMe,
    Object.keys(query).length > 0 ? query : undefined,
  );
  if (!url) throw new Error("Invalid my application URL");
  return url;
}

export function getInstructorApplicationDetailKey(
  id: string,
  locale?: string,
): string {
  const query: Record<string, string> = {};
  if (locale) query.locale = locale;
  const url = buildQueryParams(
    routes.applicationById,
    Object.keys(query).length > 0 ? query : undefined,
    {
      id: String(id),
    },
  );
  if (!url) throw new Error("Invalid application URL");
  return url;
}

export function getInstructorProfilesListKey(
  filters: InstructorListFilters = {},
): string | null {
  return buildQueryParams(routes.profiles, listQueryToRecord(filters));
}

export function getInstructorProfileDetailKey(userId: string): string {
  const url = buildQueryParams(routes.profileByUser, undefined, {
    id: String(userId),
  });
  if (!url) throw new Error("Invalid profile URL");
  return url;
}

export function getInstructorExpertiseTopicsKey(
  instructorId: string,
  locale?: string,
): string {
  const query: Record<string, string> = {};
  if (locale) query.locale = locale;
  const url = buildQueryParams(
    routes.expertiseTopics,
    Object.keys(query).length > 0 ? query : undefined,
    {
      id: String(instructorId),
    },
  );
  if (!url) throw new Error("Invalid expertise topics URL");
  return url;
}

export function getInstructorExpertiseSkillsKey(
  instructorId: string,
  locale?: string,
): string {
  const query: Record<string, string> = {};
  if (locale) query.locale = locale;
  const url = buildQueryParams(
    routes.expertiseSkills,
    Object.keys(query).length > 0 ? query : undefined,
    {
      id: String(instructorId),
    },
  );
  if (!url) throw new Error("Invalid expertise skills URL");
  return url;
}

export function getInstructorTicketsListKey(
  filters: InstructorTicketListFilters = {},
): string | null {
  return buildQueryParams(routes.tickets, listQueryToRecord(filters));
}

export function getInstructorTicketMessagesKey(ticketId: string): string {
  const url = buildQueryParams(routes.ticketMessages, undefined, {
    id: String(ticketId),
  });
  if (!url) throw new Error("Invalid ticket messages URL");
  return url;
}
