"use client";

import Image from "next/image";
import { InstructorAccountStatusBadges } from "@/components/features/instructor/instructor-account-status-badges";
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
  showAccountBadges?: boolean;
};

export function InstructorUserCell({
  user,
  showAccountBadges = true,
}: InstructorUserCellProps) {
  const displayName = resolveInstructorDisplayName(user);
  const email = user.email ?? "";
  const avatarUrl = user.avatar ?? "";
  const { label, color, backgroundColor } = pickCharacter(
    displayName || "User",
  );

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
          {showAccountBadges ? (
            <InstructorAccountStatusBadges user={user} mode="inline" />
          ) : null}
        </div>
        {email ? (
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        ) : null}
      </div>
    </div>
  );
}
