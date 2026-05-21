"use client";

import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { HEADER_DROPDOWN_ITEMS } from "@/constants";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { MeResponse } from "@/types/auth";

interface UserMenuDropdownItemsProps {
  me?: MeResponse;
  /** Show name + email block above menu groups (desktop user menu). */
  showUserHeader?: boolean;
  /** Called when a menu link is clicked (e.g. close mobile sidebar). */
  onItemClick?: () => void;
}

/**
 * Shared dropdown link groups for header user menu and mobile sidebar auth.
 */
export function UserMenuDropdownItems({
  me,
  showUserHeader = false,
  onItemClick,
}: UserMenuDropdownItemsProps) {
  return (
    <>
      {showUserHeader && me ? (
        <div className="mb-2 px-2">
          <p className="text-base font-medium text-object-black/90">
            {me.display_name}
          </p>
          <p className="text-base text-object-black/60">{me.email}</p>
        </div>
      ) : null}

      {HEADER_DROPDOWN_ITEMS.map((group, index) => (
        <div key={group.key}>
          {(showUserHeader || (!showUserHeader && index > 0)) && (
            <DropdownMenuSeparator className="my-1 bg-object-black/10" />
          )}
          {group.value.map((item) => (
            <DropdownMenuItem
              key={item.title}
              className="p-0 px-2"
              variant={item.status === "warning" ? "destructive" : "default"}
            >
              <Link
                href={item.href}
                onClick={onItemClick}
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
    </>
  );
}
