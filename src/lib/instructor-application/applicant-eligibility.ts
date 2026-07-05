import type { InstructorUserIdentity } from "@/types/instructor";

export type InstructorApplicantAccountFields = Pick<
  InstructorUserIdentity,
  "is_disabled" | "email_confirmed" | "banned_until" | "is_banned"
>;

export function isInstructorApplicantBanned(
  user: InstructorApplicantAccountFields,
): boolean {
  return user.is_banned === true;
}

export function isInstructorApplicantEligibleForReview(
  user: InstructorApplicantAccountFields,
): boolean {
  if (user.is_disabled === true) {
    return false;
  }
  if (user.email_confirmed === false) {
    return false;
  }
  if (isInstructorApplicantBanned(user)) {
    return false;
  }
  return true;
}
