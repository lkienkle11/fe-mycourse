"use client";

import { InstructorAccountStatusBadges } from "@/components/features/instructor/instructor-account-status-badges";
import type { InstructorApplicantAccountFields } from "@/lib/instructor-application/applicant-eligibility";

export type InstructorApplicantUserStatusCellProps = {
  user: Partial<InstructorApplicantAccountFields>;
};

export function InstructorApplicantUserStatusCell({
  user,
}: InstructorApplicantUserStatusCellProps) {
  return <InstructorAccountStatusBadges user={user} mode="status-column" />;
}
