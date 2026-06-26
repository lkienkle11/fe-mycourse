"use client";

import type { ComponentProps } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { deferDropdownAction } from "@/lib/utils/defer-dropdown-action";

export type DeferredDropdownMenuItemProps = Omit<
  ComponentProps<typeof DropdownMenuItem>,
  "onSelect" | "onClick"
> & {
  onAction: () => void;
};

export function DeferredDropdownMenuItem({
  onAction,
  ...props
}: DeferredDropdownMenuItemProps) {
  return (
    <DropdownMenuItem
      {...props}
      onSelect={() => {
        deferDropdownAction(onAction);
      }}
    />
  );
}
