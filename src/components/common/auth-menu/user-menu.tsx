"use client";

import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HEADER_DROPDOWN_ITEMS } from "@/constants";
import { Link } from "@/i18n/navigation";
import { cn, pickCharacter } from "@/lib/utils";
import type { MeResponse } from "@/types/auth";

interface UserMenuProps {
  me: MeResponse;
}

export const UserMenu = ({ me }: UserMenuProps) => {
  const { label, color, backgroundColor } = pickCharacter(me.display_name);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="size-10 rounded-full border border-object-black/10 bg-white/95 hover:cursor-pointer"
        aria-label="Open user menu"
      >
        {me.avatar_url ? (
          <Image
            src={me.avatar_url}
            alt={`${me.display_name} avatar`}
            width={40}
            height={40}
            className="size-full rounded-full object-cover"
          />
        ) : (
          <div
            className="flex size-full items-center justify-center rounded-full"
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
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="relative z-100 rounded-md border-none bg-white p-4 min-w-60 shadow-[0_0_0_1px_rgba(15,23,42,0.06),0_0_24px_rgba(15,23,42,0.1),0_0_48px_rgba(15,23,42,0.06)]"
      >
        <div className="pointer-events-none absolute -top-2 right-6 rotate-45 bg-white" />

        <div className="mb-2 px-2">
          <p className="text-base font-medium text-object-black/90">
            {me.display_name}
          </p>
          <p className="text-base text-object-black/60">{me.email}</p>
        </div>

        {HEADER_DROPDOWN_ITEMS.map((group) => (
          <div key={group.key}>
            <DropdownMenuSeparator className="my-1 bg-object-black/10" />
            {group.value.map((item) => (
              <DropdownMenuItem
                key={item.title}
                className="p-0 px-2"
                variant={item.status === "warning" ? "destructive" : "default"}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "block w-full py-2 text-base leading-[120%] transition-colors hover:opacity-85",
                    item.status === "warning"
                      ? "text-alert-error"
                      : "text-object-black/90",
                    item.itemClassName,
                  )}
                >
                  {item.title}
                </Link>
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
