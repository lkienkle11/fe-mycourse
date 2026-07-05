"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import {
  type InstructorApplicantAccountFields,
  isInstructorApplicantBanned,
} from "@/lib/instructor-application/applicant-eligibility";

export type InstructorApplicantUserStatusCellProps = {
  user: Partial<InstructorApplicantAccountFields>;
};

export function InstructorApplicantUserStatusCell({
  user,
}: InstructorApplicantUserStatusCellProps) {
  const t = useTranslations("instructor.common");
  const showDisabled = user.is_disabled === true;
  const showBanned = isInstructorApplicantBanned(user);
  const showUnconfirmed = user.email_confirmed === false;
  const isActive = !showDisabled && !showBanned && !showUnconfirmed;

  if (isActive) {
    return (
      <Badge variant="outline" className="text-[10px]">
        {t("userStatusActive")}
      </Badge>
    );
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      {showDisabled ? (
        <Badge variant="destructive" className="shrink-0 text-[10px]">
          {t("badgeDisabled")}
        </Badge>
      ) : null}
      {showBanned ? (
        <Badge variant="destructive" className="shrink-0 text-[10px]">
          {t("badgeBannedUntil", {
            date: new Date(
              (user.banned_until ?? 0) * 1000,
            ).toLocaleDateString(),
          })}
        </Badge>
      ) : null}
      {showUnconfirmed ? (
        <Badge
          variant="outline"
          className="shrink-0 border-amber-200 bg-amber-50 text-[10px] text-amber-950"
        >
          {t("badgeEmailUnconfirmed")}
        </Badge>
      ) : null}
    </div>
  );
}
