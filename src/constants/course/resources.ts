import { PERMISSIONS } from "@/constants/permissions";
import type { PermissionName } from "@/types/permissions";

/** Any read permission in the sysadmin/admin course menu group. */
export const COURSE_GROUP_READ_PERMISSIONS: readonly PermissionName[] = [
  PERMISSIONS.CourseCatalogRead,
  PERMISSIONS.CourseReviewRead,
  PERMISSIONS.CourseTrashRead,
];
