/** Role names — mirror BE `role:"..."` tags in `roles_permission.go`. */
export const ROLES = {
  SYSADMIN: "sysadmin",
  ADMIN: "admin",
  INSTRUCTOR: "instructor",
  LEARNER: "learner",
} as const;
