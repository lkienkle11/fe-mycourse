/**
 * Browser-bound instructor caller singletons.
 */

import { browserApiMethods } from "@/api/transport/browser-api-methods";
import { createInstructorCallers } from "./instructor-factory";

const browserInstructorCallers = createInstructorCallers(browserApiMethods);
export const listInstructorRosterCandidatesService =
  browserInstructorCallers.listInstructorRosterCandidatesService;
export const addInstructorRosterBulkService =
  browserInstructorCallers.addInstructorRosterBulkService;
export const listInstructorRosterService =
  browserInstructorCallers.listInstructorRosterService;
export const deleteInstructorRosterService =
  browserInstructorCallers.deleteInstructorRosterService;
export const getMyInstructorApplicationService =
  browserInstructorCallers.getMyInstructorApplicationService;
export const submitInstructorApplicationService =
  browserInstructorCallers.submitInstructorApplicationService;
export const resubmitInstructorApplicationService =
  browserInstructorCallers.resubmitInstructorApplicationService;
export const contactInstructorAdminService =
  browserInstructorCallers.contactInstructorAdminService;
export const listInstructorApplicationsService =
  browserInstructorCallers.listInstructorApplicationsService;
export const getInstructorApplicationService =
  browserInstructorCallers.getInstructorApplicationService;
export const approveInstructorApplicationService =
  browserInstructorCallers.approveInstructorApplicationService;
export const rejectInstructorApplicationService =
  browserInstructorCallers.rejectInstructorApplicationService;
export const deleteInstructorApplicationService =
  browserInstructorCallers.deleteInstructorApplicationService;
export const listInstructorProfilesService =
  browserInstructorCallers.listInstructorProfilesService;
export const getInstructorProfileByUserService =
  browserInstructorCallers.getInstructorProfileByUserService;
export const upsertInstructorProfileService =
  browserInstructorCallers.upsertInstructorProfileService;
export const deleteInstructorProfileService =
  browserInstructorCallers.deleteInstructorProfileService;
export const listInstructorExpertiseTopicsService =
  browserInstructorCallers.listInstructorExpertiseTopicsService;
export const addInstructorExpertiseTopicService =
  browserInstructorCallers.addInstructorExpertiseTopicService;
export const deleteInstructorExpertiseTopicService =
  browserInstructorCallers.deleteInstructorExpertiseTopicService;
export const listInstructorExpertiseSkillsService =
  browserInstructorCallers.listInstructorExpertiseSkillsService;
export const addInstructorExpertiseSkillService =
  browserInstructorCallers.addInstructorExpertiseSkillService;
export const deleteInstructorExpertiseSkillService =
  browserInstructorCallers.deleteInstructorExpertiseSkillService;
export const listInstructorTicketsService =
  browserInstructorCallers.listInstructorTicketsService;
export const createInstructorTicketService =
  browserInstructorCallers.createInstructorTicketService;
export const closeInstructorTicketService =
  browserInstructorCallers.closeInstructorTicketService;
export const listInstructorTicketMessagesService =
  browserInstructorCallers.listInstructorTicketMessagesService;
export const addInstructorTicketMessageService =
  browserInstructorCallers.addInstructorTicketMessageService;
