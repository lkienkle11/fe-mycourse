"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { BrowseMenuItem } from "@/types/browse-menu";

export interface BrowseMenuTreeProps {
  items: BrowseMenuItem[];
  depth?: number;
  /** Called when a leaf link is clicked (e.g. close mobile sidebar). */
  onLinkClick?: () => void;
}

const PADDING_LEFT_BASE = 1; // 16px

/**
 * Recursive accordion tree for browse categories (mobile sidebar).
 */
export function BrowseMenuTree({
  items,
  depth = 0,
  onLinkClick,
}: BrowseMenuTreeProps) {
  return (
    <>
      {items.map((item) =>
        item.children?.length ? (
          <AccordionItem key={item.id} value={`${depth}-${item.id}`}>
            <AccordionTrigger
              className={cn(
                "hover:no-underline",
                depth === 0 ? "py-3" : "py-2",
              )}
              style={{
                paddingLeft:
                  depth > 0 ? `${PADDING_LEFT_BASE * depth}rem` : "0px",
              }}
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

            <AccordionContent className="pb-0 h-auto! overflow-visible">
              <div className="pb-2">
                <Accordion type="single" collapsible className="w-full">
                  <BrowseMenuTree
                    items={item.children}
                    depth={depth + 1}
                    onLinkClick={onLinkClick}
                  />
                </Accordion>
              </div>
            </AccordionContent>
          </AccordionItem>
        ) : (
          <div
            key={item.id}
            className={cn("not-last:border-b border-black/8")}
            style={{
              paddingLeft:
                depth > 0 ? `${PADDING_LEFT_BASE * depth}rem` : "0px",
            }}
          >
            <Link
              href={item.href as "/"}
              onClick={onLinkClick}
              className="flex flex-col rounded-md py-2.5 no-underline! hover:no-underline! transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
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
