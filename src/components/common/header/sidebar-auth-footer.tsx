"use client";

import { ChevronsUpDown } from "lucide-react";
import { AuthButton } from "@/components/common/auth-menu/auth-button";
import { UserMenuDropdownItems } from "@/components/common/auth-menu/user-menu-dropdown-items";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGetMe } from "@/hooks";

interface SidebarAuthFooterProps {
  onNavigate?: () => void;
}

/**
 * Auth row for the mobile header sidebar: guest buttons or logged-in user menu.
 */
export function SidebarAuthFooter({ onNavigate }: SidebarAuthFooterProps) {
  const { me, isLoading } = useGetMe();

  if (isLoading) {
    return (
      <div
        className="h-10 w-full animate-pulse rounded-md bg-object-black/10"
        aria-hidden
      />
    );
  }

  if (!me) {
    return (
      <AuthButton
        className="w-full flex-row justify-between gap-2"
        onBeforeClickAuthButton={onNavigate}
      />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex w-full flex-row items-center justify-between gap-2 rounded-md border border-object-black/10 bg-white/95 px-2 py-1.5 hover:cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Open account menu"
      >
        <UserAvatar
          name={me.display_name}
          src={me.avatar_url}
          alt=""
          size={40}
          className="size-10 rounded-md"
          textClassName="text-base"
        />
        <span className="min-w-0 flex-1 truncate text-left text-sm font-medium text-object-black/90">
          {me.display_name}
        </span>
        <ChevronsUpDown
          className="size-4 shrink-0 text-object-black/50"
          aria-hidden
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="top"
        sideOffset={8}
        className="relative z-1000 w-(--radix-dropdown-menu-trigger-width) min-w-60 rounded-md border-none bg-white p-4 shadow-[0_0_0_1px_rgba(15,23,42,0.06),0_0_24px_rgba(15,23,42,0.1)]"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
        }}
      >
        <UserMenuDropdownItems onItemClick={onNavigate} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
