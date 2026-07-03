"use client";

import Image from "next/image";
import { resolveInstructorDisplayName } from "@/lib/instructor-application/helpers";
import { pickCharacter } from "@/lib/utils";
import type { InstructorApplication } from "@/types/instructor";

export type InstructorUserCellProps = {
  application: Pick<
    InstructorApplication,
    "display_name" | "full_name" | "email" | "avatar"
  >;
};

export function InstructorUserCell({ application }: InstructorUserCellProps) {
  const displayName = resolveInstructorDisplayName(application);
  const email = application.email ?? "";
  const avatarUrl = application.avatar ?? "";
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
        <p className="truncate font-medium">{displayName || "—"}</p>
        {email ? (
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        ) : null}
      </div>
    </div>
  );
}
