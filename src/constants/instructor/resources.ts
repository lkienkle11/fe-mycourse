import { PERMISSIONS } from "@/constants/permissions";
import type { PermissionName } from "@/types/permissions";

/** Any read permission in the instructor admin menu group. */
export const INSTRUCTOR_GROUP_READ_PERMISSIONS: readonly PermissionName[] = [
  PERMISSIONS.InstructorRosterRead,
  PERMISSIONS.InstructorApplicationRead,
  PERMISSIONS.InstructorProfileRead,
  PERMISSIONS.InstructorExpertiseRead,
];
