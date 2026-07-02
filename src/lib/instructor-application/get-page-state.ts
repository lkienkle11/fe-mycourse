import { PERMISSIONS } from "@/constants/permissions";
import type { MyInstructorApplication } from "@/types/instructor";
import type { InstructorApplicationPageState } from "./types";

type GetPageStateInput = {
  isLoggedIn: boolean;
  application: MyInstructorApplication | null | undefined;
  permissions: readonly string[];
};

/**
 * Resolve become-instructor page state (A–H).
 * Priority: A → G → H → B → C/D/E/F (see docs/instructor-application.md).
 */
export function getPageState({
  isLoggedIn,
  application,
  permissions,
}: GetPageStateInput): InstructorApplicationPageState {
  if (!isLoggedIn) return "A";
  if (application?.review_status === "approved") return "G";
  if ((application?.rejection_count ?? 0) >= 5) return "H";
  if (permissions.includes(PERMISSIONS.InstructorApplicationSubmitBlocked)) {
    return "B";
  }
  if (!application) return "C";
  if (application.review_status === "pending") return "D";
  if (application.review_status === "returned") return "E";
  if (application.review_status === "rejected") return "F";
  return "C";
}
