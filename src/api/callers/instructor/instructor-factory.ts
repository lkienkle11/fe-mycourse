/**
 * Instructor callers factory — composes domain slices.
 */

import type { ApiMethods } from "@/api/core/methods";
import { createInstructorApplicationCallers } from "./instructor-factory-application";
import { createInstructorExpertiseCallers } from "./instructor-factory-expertise";
import { createInstructorProfileCallers } from "./instructor-factory-profile";
import { createInstructorRosterCallers } from "./instructor-factory-roster";
import { createInstructorTicketCallers } from "./instructor-factory-ticket";

export {
  getInstructorApplicationDetailKey,
  getInstructorApplicationsListKey,
  getInstructorExpertiseSkillsKey,
  getInstructorExpertiseTopicsKey,
  getInstructorProfileDetailKey,
  getInstructorProfilesListKey,
  getInstructorRosterCandidatesKey,
  getInstructorRosterListKey,
  getInstructorTicketMessagesKey,
  getInstructorTicketsListKey,
  getMyInstructorApplicationKey,
} from "./instructor-factory-keys";

export function createInstructorCallers(methods: ApiMethods) {
  return {
    ...createInstructorRosterCallers(methods),
    ...createInstructorApplicationCallers(methods),
    ...createInstructorProfileCallers(methods),
    ...createInstructorExpertiseCallers(methods),
    ...createInstructorTicketCallers(methods),
  };
}
