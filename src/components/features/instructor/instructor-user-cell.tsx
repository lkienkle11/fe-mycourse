"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { resolveInstructorDisplayName } from "@/lib/instructor-application/helpers";
import { pickCharacter } from "@/lib/utils";
import type { InstructorUserIdentity } from "@/types/instructor";

export type InstructorUserCellProps = {
  user: Partial<
    Pick<
      InstructorUserIdentity,
      | "display_name"
      | "full_name"
      | "email"
      | "avatar"
      | "is_disabled"
      | "email_confirmed"
    >
  >;
};

export function InstructorUserCell({ user }: InstructorUserCellProps) {
  const t = useTranslations("instructor.common");
  const displayName = resolveInstructorDisplayName(user);
  const email = user.email ?? "";
  const avatarUrl = user.avatar ?? "";
  const { label, color, backgroundColor } = pickCharacter(
    displayName || "User",
  );
  const showDisabled = user.is_disabled === true;
  const showUnconfirmed = user.email_confirmed === false;

  return (
    <div className="flex min-w-0 items-center gap-3">
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={`${displayName} avatar`}
          width={36}
          height={36}
          className="size-9 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor }}
        >
          <span
            style={{ color }}
            className="text-xs font-semibold leading-none"
          >
            {label}
          </span>
        </div>
      )}
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <p className="truncate font-medium">{displayName || "—"}</p>
          {showDisabled ? (
            <Badge variant="destructive" className="shrink-0 text-[10px]">
              {t("badgeDisabled")}
            </Badge>
          ) : null}
          {showUnconfirmed ? (
            <Badge variant="secondary" className="shrink-0 text-[10px]">
              {t("badgeEmailUnconfirmed")}
            </Badge>
          ) : null}
        </div>
        {email ? (
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        ) : null}
      </div>
    </div>
  );
}
