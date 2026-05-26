"use client";

import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useFilteredUserMenuGroups } from "@/hooks/auth";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { MeResponse } from "@/types/auth";
import type { UserMenuItem } from "@/types/user-menu";

function UserMenuDropdownLinks({
  items,
  onItemClick,
  nested = false,
}: {
  items: readonly UserMenuItem[];
  onItemClick?: () => void;
  nested?: boolean;
}) {
  return (
    <>
      {items.map((item) => (
        <div key={`${item.href}-${item.title}`}>
          <DropdownMenuItem
            className={cn("p-0 px-2", nested && "pl-4")}
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
          {item.children?.length ? (
            <UserMenuDropdownLinks
              items={item.children}
              onItemClick={onItemClick}
              nested
            />
          ) : null}
        </div>
      ))}
    </>
  );
}

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
  const menuGroups = useFilteredUserMenuGroups();

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

      {menuGroups.map((group, index) => (
        <div key={group.key}>
          {(showUserHeader || index > 0) && (
            <DropdownMenuSeparator className="my-1 bg-object-black/10" />
          )}
          <UserMenuDropdownLinks
            items={group.value}
            onItemClick={onItemClick}
          />
        </div>
      ))}
    </>
  );
}
