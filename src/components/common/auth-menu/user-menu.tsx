"use client";

import { UserAvatar } from "@/components/shared/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MeResponse } from "@/types/auth";
import { UserMenuDropdownItems } from "./user-menu-dropdown-items";

interface UserMenuProps {
  me: MeResponse;
}

export const UserMenu = ({ me }: UserMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="size-10 rounded-full border border-object-black/10 bg-white/95 hover:cursor-pointer"
        aria-label="Open user menu"
      >
        <UserAvatar
          name={me.display_name}
          src={me.avatar_url}
          size={40}
          className="size-full"
          textClassName="text-base"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="relative z-100 rounded-md border-none bg-white p-4 min-w-60 shadow-[0_0_0_1px_rgba(15,23,42,0.06),0_0_24px_rgba(15,23,42,0.1),0_0_48px_rgba(15,23,42,0.06)]"
      >
        <div className="pointer-events-none absolute -top-2 right-6 rotate-45 bg-white" />

        <UserMenuDropdownItems me={me} showUserHeader />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
