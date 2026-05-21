"use client";

import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { BROWSE_MENU_ITEMS } from "@/constants/browse-menu";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { BrowseMenuItem } from "@/types/browse-menu";

// ─── Desktop: one column per depth level ──────────────────────────────────────

interface MenuColumnProps {
  items: BrowseMenuItem[];
  /** depth=0 → root column, depth=1 → children, depth=2 → grandchildren, … */
  depth: number;
  activeStack: BrowseMenuItem[];
  onHover: (item: BrowseMenuItem, depth: number) => void;
}

function MenuColumn({ items, depth, activeStack, onHover }: MenuColumnProps) {
  const activeAtDepth = activeStack[depth];

  return (
    <div className="w-[267px]">
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href as "/"}
          onMouseEnter={() => onHover(item, depth)}
          className={cn(
            "flex h-[49px] w-full items-center justify-between px-3 transition-colors outline-none",
            "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50",
            activeAtDepth?.id === item.id
              ? "bg-[rgba(249,249,249,0.9)]"
              : "hover:bg-[rgba(249,249,249,0.5)]",
          )}
        >
          <div className="flex flex-col">
            <span className="text-[14px] leading-[18px] font-normal text-[#1b1b1b]">
              {item.title}
            </span>
            <span className="text-[12px] leading-[15px] font-normal text-[rgba(27,27,27,0.6)]">
              {item.description}
            </span>
          </div>
          {item.children?.length ? (
            <ChevronRight
              className="size-4 shrink-0 text-[rgba(27,27,27,0.4)]"
              aria-hidden
            />
          ) : null}
        </Link>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * Browse navigation — desktop flyout (lg+). Mobile tree lives in HeaderMobileSidebar.
 */
export function HeaderBrowseNav() {
  const t = useTranslations("commonHeader");

  const [activeStack, setActiveStack] = useState<BrowseMenuItem[]>([]);

  function handleHover(item: BrowseMenuItem, depth: number) {
    setActiveStack((prev) => {
      const next = prev.slice(0, depth);
      if (item.children?.length) {
        next[depth] = item;
      }
      return next;
    });
  }

  return (
    <NavigationMenu
      viewport={false}
      className="hidden lg:flex items-center"
      onValueChange={(value) => {
        if (!value) setActiveStack([]);
      }}
    >
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger
            className={cn(
              "h-auto gap-0.5 px-2 py-1",
              "bg-transparent hover:bg-transparent focus:bg-transparent",
              "data-open:bg-transparent data-popup-open:bg-transparent",
              "text-base font-normal leading-[21px] text-[#1b1b1b]",
            )}
          >
            {t("browse.label")}
          </NavigationMenuTrigger>

          <NavigationMenuContent className="!overflow-visible p-0 border-0 shadow-none ring-0 bg-transparent">
            <div className="relative mt-0">
              <div
                className="pointer-events-none absolute -top-[7px] left-5 z-10 h-0 w-0 border-x-[7px] border-x-transparent border-b-[8px] border-b-white drop-shadow-[0_-1px_2px_rgba(0,0,0,0.08)]"
                aria-hidden
              />

              <div className="flex overflow-hidden rounded-md bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.06]">
                <MenuColumn
                  items={BROWSE_MENU_ITEMS}
                  depth={0}
                  activeStack={activeStack}
                  onHover={handleHover}
                />

                {activeStack.map((active, i) =>
                  active.children?.length ? (
                    <MenuColumn
                      key={`browse-col-${active.id}`}
                      items={active.children}
                      depth={i + 1}
                      activeStack={activeStack}
                      onHover={handleHover}
                    />
                  ) : null,
                )}
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
