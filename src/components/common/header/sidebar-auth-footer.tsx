"use client";

import { ChevronsUpDown } from "lucide-react";
import Image from "next/image";
import { AuthButton } from "@/components/common/auth-menu/auth-button";
import { UserMenuDropdownItems } from "@/components/common/auth-menu/user-menu-dropdown-items";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGetMe } from "@/hooks";
import { pickCharacter } from "@/lib/utils";

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

  const { label, color, backgroundColor } = pickCharacter(me.display_name);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex w-full flex-row items-center justify-between gap-2 rounded-md border border-object-black/10 bg-white/95 px-2 py-1.5 hover:cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Open account menu"
      >
        {me.avatar_url ? (
          <Image
            src={me.avatar_url}
            alt=""
            width={40}
            height={40}
            className="size-10 shrink-0 rounded-md object-cover"
          />
        ) : (
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-md"
            style={{ backgroundColor }}
          >
            <span
              style={{ color }}
              className="text-base font-semibold leading-none"
            >
              {label}
            </span>
          </div>
        )}
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
        className="relative z-100 w-(--radix-dropdown-menu-trigger-width) min-w-60 rounded-md border-none bg-white p-4 shadow-[0_0_0_1px_rgba(15,23,42,0.06),0_0_24px_rgba(15,23,42,0.1)]"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
        }}
      >
        <UserMenuDropdownItems onItemClick={onNavigate} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
