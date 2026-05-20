"use client";

import { ChevronRight, MenuIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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

// ─── Mobile: nested Accordions for unlimited depth ────────────────────────────

interface MobileMenuItemsProps {
  items: BrowseMenuItem[];
  depth?: number;
}

function MobileMenuItems({ items, depth = 0 }: MobileMenuItemsProps) {
  return (
    <>
      {items.map((item) =>
        item.children?.length ? (
          /* Has children → collapsible Accordion item */
          <AccordionItem key={item.id} value={`${depth}-${item.id}`}>
            <AccordionTrigger
              className={cn(
                "hover:no-underline",
                depth === 0 ? "py-3" : "py-2",
              )}
            >
              <div className="flex flex-col items-start text-left">
                <span
                  className={cn(
                    "font-medium text-foreground",
                    depth === 0 ? "text-sm" : "text-xs",
                  )}
                >
                  {item.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {item.description}
                </span>
              </div>
            </AccordionTrigger>

            <AccordionContent className="pb-0">
              {/* Indent each level and recurse */}
              <div className={cn("pb-2", depth > 0 && "pl-3")}>
                <Accordion type="single" collapsible className="w-full">
                  <MobileMenuItems items={item.children} depth={depth + 1} />
                </Accordion>
              </div>
            </AccordionContent>
          </AccordionItem>
        ) : (
          /* Leaf node → plain link row */
          <div
            key={item.id}
            className={cn(
              "[&:not(:last-child)]:border-b border-black/[0.08]",
              depth > 0 && "pl-3",
            )}
          >
            <Link
              href={item.href as "/"}
              className="flex flex-col rounded-md py-2.5 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
            >
              <span
                className={cn(
                  "font-medium text-foreground",
                  depth === 0 ? "text-sm" : "text-xs",
                )}
              >
                {item.title}
              </span>
              <span className="text-xs text-muted-foreground">
                {item.description}
              </span>
            </Link>
          </div>
        ),
      )}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * Browse navigation — desktop (md+) and mobile (max-md) in one component.
 *
 * Desktop hover cascade (N levels):
 *   activeStack[0] = item hovered at depth 0 (root)
 *   activeStack[1] = item hovered at depth 1 (children of activeStack[0])
 *   … and so on.
 *   Each depth level renders one 267 px column.
 *
 * Mobile: Sheet (side=left) with recursively nested Accordions.
 *
 * Figma refs:
 *   4990:21528 trigger · 4990:21513 panel · 4990:21514 parent col · 4990:21522 child col
 */
export function HeaderBrowseNav() {
  const t = useTranslations("commonHeader");

  /**
   * Stack of hovered items, one per depth level.
   * Empty on panel open → only the root column is visible.
   */
  const [activeStack, setActiveStack] = useState<BrowseMenuItem[]>([]);

  function handleHover(item: BrowseMenuItem, depth: number) {
    setActiveStack((prev) => {
      // Keep levels 0…depth-1, set level depth to the new item (if it has children),
      // discard deeper levels.
      const next = prev.slice(0, depth);
      if (item.children?.length) {
        next[depth] = item;
      }
      return next;
    });
  }

  return (
    <>
      {/* ── Desktop / tablet (md+) ── */}
      <NavigationMenu
        viewport={false}
        className="hidden md:flex items-center"
        onValueChange={(value) => {
          if (!value) setActiveStack([]);
        }}
      >
        <NavigationMenuList>
          <NavigationMenuItem>
            {/* Trigger — Figma 4990:21528: "Browse" 16px Gilroy Regular */}
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

            {/* Flyout panel — Figma 4990:21513 */}
            <NavigationMenuContent className="!overflow-visible p-0 border-0 shadow-none ring-0 bg-transparent">
              <div className="relative mt-0">
                {/* Upward caret (triangle pointing to Browse trigger) */}
                <div
                  className="pointer-events-none absolute -top-[7px] left-5 z-10 h-0 w-0 border-x-[7px] border-x-transparent border-b-[8px] border-b-white drop-shadow-[0_-1px_2px_rgba(0,0,0,0.08)]"
                  aria-hidden
                />

                {/*
                  Multi-column panel.
                  Columns are added dynamically as the user hovers deeper:
                    depth 0 → always visible (root items)
                    depth 1 → visible when activeStack[0] has children
                    depth 2 → visible when activeStack[1] has children
                    … and so on.
                */}
                <div className="flex overflow-hidden rounded-md bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.06]">
                  {/* Root column — always rendered */}
                  <MenuColumn
                    items={BROWSE_MENU_ITEMS}
                    depth={0}
                    activeStack={activeStack}
                    onHover={handleHover}
                  />

                  {/* Child columns — rendered only when the parent at that depth has children */}
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

      {/* ── Mobile (max-md) ── */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("browse.categoriesTitle")}
            >
              <MenuIcon className="size-5" />
            </Button>
          </SheetTrigger>

          <SheetContent
            side="left"
            showCloseButton
            className="flex w-[85vw] max-w-[320px] flex-col gap-0 p-0"
          >
            <SheetHeader className="border-b border-black/[0.08] px-4 py-4">
              <SheetTitle className="text-base font-semibold">
                {t("browse.categoriesTitle")}
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-4 py-2">
              <Accordion type="single" collapsible className="w-full">
                <MobileMenuItems items={BROWSE_MENU_ITEMS} />
              </Accordion>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
