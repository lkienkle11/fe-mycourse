"use client";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANGUAGE_OPTIONS } from "@/constants";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ currentLabel }: { currentLabel: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "default" }),
          "font-medium",
        )}
      >
        {currentLabel}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 relative z-100">
        {LANGUAGE_OPTIONS.map((item) => (
          <DropdownMenuItem key={item.locale} className="p-0">
            <Link
              href="/"
              locale={item.locale}
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
