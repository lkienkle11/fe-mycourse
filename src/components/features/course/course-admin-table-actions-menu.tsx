"use client";

import { MoreHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type CourseAdminTableActionsMenuProps = {
  menuLabel: string;
  disabled?: boolean;
  children: ReactNode;
};

export function CourseAdminTableActionsMenu({
  menuLabel,
  disabled = false,
  children,
}: CourseAdminTableActionsMenuProps) {
  return (
    // Non-modal so opening a Dialog from a menu item does not leave `body` with
    // `pointer-events: none` after the dialog closes (Radix layer stack bug).
    // Pair menu items that open dialogs with DeferredDropdownMenuItem.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          disabled={disabled}
          aria-label={menuLabel}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}
