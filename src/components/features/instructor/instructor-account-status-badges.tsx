"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import {
  type InstructorApplicantAccountFields,
  isInstructorApplicantBanned,
} from "@/lib/instructor-application/applicant-eligibility";

export type InstructorAccountStatusBadgesProps = {
  user: Partial<InstructorApplicantAccountFields>;
  /** Full status column shows Active when no issues; inline mode hides Active. */
  mode?: "status-column" | "inline";
};

export function InstructorAccountStatusBadges({
  user,
  mode = "status-column",
}: InstructorAccountStatusBadgesProps) {
  const t = useTranslations("instructor.common");
  const showDisabled = user.is_disabled === true;
  const showBanned = isInstructorApplicantBanned(user);
  const showUnconfirmed = user.email_confirmed === false;
  const isActive = !showDisabled && !showBanned && !showUnconfirmed;

  if (mode === "status-column" && isActive) {
    return (
      <Badge variant="outline" className="text-[10px]">
        {t("userStatusActive")}
      </Badge>
    );
  }

  if (mode === "inline" && !showDisabled && !showUnconfirmed) {
    return null;
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      {showDisabled ? (
        <Badge variant="destructive" className="shrink-0 text-[10px]">
          {t("badgeDisabled")}
        </Badge>
      ) : null}
      {mode === "status-column" && showBanned ? (
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
          variant={mode === "status-column" ? "outline" : "secondary"}
          className={
            mode === "status-column"
              ? "shrink-0 border-amber-200 bg-amber-50 text-[10px] text-amber-950"
              : "shrink-0 text-[10px]"
          }
        >
          {t("badgeEmailUnconfirmed")}
        </Badge>
      ) : null}
    </div>
  );
}
