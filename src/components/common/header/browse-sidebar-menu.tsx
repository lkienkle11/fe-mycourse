"use client";

import { ChevronRight } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { BrowseMenuItem } from "@/types/browse-menu";

export interface BrowseSidebarMenuProps {
  items: BrowseMenuItem[];
  depth?: number;
  /** Called when a leaf link is clicked (e.g. close mobile sidebar). */
  onLinkClick?: () => void;
}

function BrowseMenuLabel({
  item,
  depth,
}: {
  item: BrowseMenuItem;
  depth: number;
}) {
  return (
    <div className="flex flex-col items-start text-left">
      <span
        className={cn(
          "font-medium text-foreground",
          depth === 0 ? "text-sm" : "text-xs",
        )}
      >
        {item.title}
      </span>
      <span className="text-xs text-muted-foreground">{item.description}</span>
    </div>
  );
}

/**
 * Top-level browse rows inside SidebarMenu (shadcn NavMain-style Collapsible).
 */
function BrowseSidebarMenuLevel({
  items,
  depth = 0,
  onLinkClick,
}: BrowseSidebarMenuProps) {
  return (
    <>
      {items.map((item) =>
        item.children?.length ? (
          <Collapsible key={item.id} asChild>
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton className="h-auto py-3 pl-0 data-[state=open]:*:data-[slot=browse-chevron]:rotate-90">
                  <BrowseMenuLabel item={item} depth={depth} />
                  <ChevronRight
                    data-slot="browse-chevron"
                    className="ml-auto size-4 shrink-0 transition-transform duration-200"
                  />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub className="mr-0 pr-0 ml-0 pl-4">
                  <BrowseSidebarMenuSubLevel
                    items={item.children}
                    depth={depth + 1}
                    onLinkClick={onLinkClick}
                  />
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ) : (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton asChild className="h-auto py-2.5 pl-0">
              <Link href={item.href as "/"} onClick={onLinkClick}>
                <BrowseMenuLabel item={item} depth={depth} />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ),
      )}
    </>
  );
}

/**
 * Nested browse rows inside SidebarMenuSub (recursive for BROWSE_MENU_ITEMS depth).
 */
function BrowseSidebarMenuSubLevel({
  items,
  depth = 0,
  onLinkClick,
}: BrowseSidebarMenuProps) {
  return (
    <>
      {items.map((item) =>
        item.children?.length ? (
          <Collapsible key={item.id} asChild>
            <SidebarMenuSubItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuSubButton className="h-auto py-2 pl-0 data-[state=open]:*:data-[slot=browse-chevron]:rotate-90">
                  <BrowseMenuLabel item={item} depth={depth} />
                  <ChevronRight
                    data-slot="browse-chevron"
                    className="ml-auto size-4 shrink-0 transition-transform duration-200"
                  />
                </SidebarMenuSubButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub className="mr-0 pr-0 ml-0 pl-4">
                  <BrowseSidebarMenuSubLevel
                    items={item.children}
                    depth={depth + 1}
                    onLinkClick={onLinkClick}
                  />
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuSubItem>
          </Collapsible>
        ) : (
          <SidebarMenuSubItem key={item.id}>
            <SidebarMenuSubButton asChild className="h-auto py-2 pl-0">
              <Link href={item.href as "/"} onClick={onLinkClick} className="">
                <BrowseMenuLabel item={item} depth={depth} />
              </Link>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        ),
      )}
    </>
  );
}

/**
 * shadcn SidebarContent browse nav experiment — Collapsible + SidebarMenu* only.
 * Uses BROWSE_MENU_ITEMS (not shadcn sample nav data). No SidebarHeader/Footer.
 */
export function BrowseSidebarMenu({
  items,
  onLinkClick,
}: BrowseSidebarMenuProps) {
  return (
    <SidebarProvider className="min-h-0 w-full">
      <SidebarContent className="min-h-0 w-full flex-1 overflow-visible bg-transparent">
        <SidebarGroup className="p-0">
          <SidebarMenu className="w-full">
            <BrowseSidebarMenuLevel
              items={items}
              depth={0}
              onLinkClick={onLinkClick}
            />
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </SidebarProvider>
  );
}
