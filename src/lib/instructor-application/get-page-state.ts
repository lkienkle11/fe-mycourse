import { PERMISSIONS } from "@/constants/permissions";
import {
  INSTRUCTOR_PAGE_STATE,
  type InstructorApplicationPageState,
} from "@/lib/instructor-application/page-state";
import type { MyInstructorApplication } from "@/types/instructor";

type GetPageStateInput = {
  isLoggedIn: boolean;
  application: MyInstructorApplication | null | undefined;
  permissions: readonly string[];
};

/**
 * Resolve become-instructor page state (semantic names; docs A–H map in instructor-application.md).
 */
export function getPageState({
  isLoggedIn,
  application,
  permissions,
}: GetPageStateInput): InstructorApplicationPageState {
  if (!isLoggedIn) return INSTRUCTOR_PAGE_STATE.unauthenticated;
  if (application?.review_status === "approved") {
    return INSTRUCTOR_PAGE_STATE.approved;
  }
  if ((application?.rejection_count ?? 0) >= 5) {
    return INSTRUCTOR_PAGE_STATE.rejected_contact_admin;
  }
  if (permissions.includes(PERMISSIONS.InstructorApplicationSubmitBlocked)) {
    return INSTRUCTOR_PAGE_STATE.submit_blocked;
  }
  if (!application) return INSTRUCTOR_PAGE_STATE.ready_to_apply;
  if (application.review_status === "pending") {
    return INSTRUCTOR_PAGE_STATE.pending_review;
  }
  if (application.review_status === "returned") {
    return INSTRUCTOR_PAGE_STATE.returned_for_revision;
  }
  if (application.review_status === "rejected") {
    return INSTRUCTOR_PAGE_STATE.rejected_can_resubmit;
  }
  return INSTRUCTOR_PAGE_STATE.ready_to_apply;
}
