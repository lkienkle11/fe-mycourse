"use client";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANGUAGE_OPTIONS } from "@/constants";
import { useCustomLanguage } from "@/hooks";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface LocaleSwitcherProps {
  /** Override trigger label; defaults to `languageLabel` from `useCustomLanguage`. */
  currentLabel?: string;
  className?: string;
  triggerClassName?: string;
  fullWidth?: boolean;
  useCodeLabelLanguage?: boolean;
  /** Called when a locale link is clicked (e.g. close mobile sidebar). */
  onNavigate?: () => void;
}

export function LocaleSwitcher({
  currentLabel,
  className,
  triggerClassName,
  fullWidth = false,
  useCodeLabelLanguage = false,
  onNavigate,
}: LocaleSwitcherProps) {
  const { languageLabel, languageCode } = useCustomLanguage();
  const triggerLabel =
    currentLabel ?? (useCodeLabelLanguage ? languageCode : languageLabel);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "default" }),
          "font-medium",
          fullWidth && "w-full justify-between",
          triggerClassName,
        )}
      >
        {triggerLabel}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={cn(
          "relative z-1000",
          fullWidth ? "w-[var(--radix-dropdown-menu-trigger-width)]" : "w-40",
          className,
        )}
      >
        {LANGUAGE_OPTIONS.map((item) => (
          <DropdownMenuItem key={item.locale} className="p-0">
            <Link
              href="/"
              locale={item.locale}
              onClick={onNavigate}
              className="block w-full px-2 py-1.5"
            >
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
