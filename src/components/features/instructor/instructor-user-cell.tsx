"use client";

import { InstructorAccountStatusBadges } from "@/components/features/instructor/instructor-account-status-badges";
import { UserAvatar } from "@/components/shared/user-avatar";
import { resolveInstructorDisplayName } from "@/lib/instructor-application/helpers";
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

  return (
    <div className="flex min-w-0 items-center gap-3">
      <UserAvatar
        name={displayName || "User"}
        src={avatarUrl}
        alt={`${displayName} avatar`}
        size={36}
        className="size-9"
      />
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
