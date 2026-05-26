"use client";

import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { DashboardCustomStyles, DashboardItem } from "@/types/dashboard";

export type DashboardSidebarProps = {
  items: DashboardItem[];
  customStyles?: DashboardCustomStyles;
  onItemClick?: (item: DashboardItem) => void;
  onNavigate?: (item: DashboardItem) => void;
  onToggle?: (item: DashboardItem) => void;
  onExpand?: (item: DashboardItem) => void;
  onCollapse?: (item: DashboardItem) => void;
  onBlur?: (item: DashboardItem) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onKeyUp?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
};

function isItemActive(pathname: string, href?: string): boolean {
  if (!href) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function useDashboardItemTitle() {
  const t = useTranslations("dashboard");
  return (item: DashboardItem) => {
    if (!item.titleKey) return item.title;
    return t(item.titleKey as Parameters<typeof t>[0]);
  };
}

function DashboardItemIcon({ item }: { item: DashboardItem }) {
  const Icon = item.icon;
  return <Icon className="size-4 shrink-0" aria-hidden />;
}

type DashboardSidebarCallbacks = Pick<
  DashboardSidebarProps,
  | "onItemClick"
  | "onNavigate"
  | "onToggle"
  | "onExpand"
  | "onCollapse"
  | "onBlur"
  | "onKeyDown"
  | "onKeyUp"
  | "customStyles"
> & {
  closeMobileMenu?: () => void;
};

function handleNavigate(
  item: DashboardItem,
  callbacks: DashboardSidebarCallbacks,
) {
  callbacks.onNavigate?.(item);
  callbacks.onItemClick?.(item);
  callbacks.closeMobileMenu?.();
}

/** Collapsed sidebar: root rows only (icon + tooltip), no child subtrees mounted. */
function DashboardSidebarCollapsed({
  items,
  pathname,
  ...callbacks
}: DashboardSidebarProps & { pathname: string }) {
  const { itemClassName, itemActiveClassName } = callbacks.customStyles ?? {};
  const itemTitle = useDashboardItemTitle();

  return (
    <SidebarMenu>
      {items.map((item) => {
        const active = isItemActive(pathname, item.href);
        const label = itemTitle(item);
        const content = (
          <>
            <DashboardItemIcon item={item} />
            <span className="sr-only">{label}</span>
          </>
        );

        return (
          <SidebarMenuItem key={item.id}>
            {item.href ? (
              <SidebarMenuButton
                asChild
                isActive={active}
                tooltip={label}
                disabled={item.disabled}
                className={cn(itemClassName, active && itemActiveClassName)}
              >
                <Link
                  href={item.href}
                  onClick={() => handleNavigate(item, callbacks)}
                >
                  {content}
                </Link>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                tooltip={label}
                disabled={item.disabled}
                className={cn(itemClassName, active && itemActiveClassName)}
                onClick={() => callbacks.onItemClick?.(item)}
              >
                {content}
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

function DashboardSidebarLevel({
  items,
  depth = 0,
  pathname,
  ...callbacks
}: DashboardSidebarProps & { pathname: string; depth?: number }) {
  const { itemClassName, itemActiveClassName } = callbacks.customStyles ?? {};
  const itemTitle = useDashboardItemTitle();

  return (
    <>
      {items.map((item) => {
        const active = isItemActive(pathname, item.href);
        const hasChildren = Boolean(item.children?.length);
        const label = itemTitle(item);

        if (hasChildren) {
          return (
            <Collapsible
              key={item.id}
              defaultOpen={active}
              onOpenChange={(open) => {
                callbacks.onToggle?.(item);
                if (open) callbacks.onExpand?.(item);
                else callbacks.onCollapse?.(item);
              }}
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    className={cn(
                      itemClassName,
                      active && itemActiveClassName,
                      "data-[state=open]:*:data-[slot=dashboard-chevron]:rotate-90",
                    )}
                    onBlur={() => callbacks.onBlur?.(item)}
                  >
                    <DashboardItemIcon item={item} />
                    <span className="truncate">{label}</span>
                    <ChevronRight
                      data-slot="dashboard-chevron"
                      className="ml-auto size-4 shrink-0 transition-transform duration-200"
                    />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub className="mx-0 mr-0 ml-2 pl-2">
                    <DashboardSidebarSubLevel
                      items={item.children ?? []}
                      depth={depth + 1}
                      pathname={pathname}
                      {...callbacks}
                    />
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        }

        return (
          <SidebarMenuItem key={item.id}>
            {item.href ? (
              <SidebarMenuButton
                asChild
                isActive={active}
                disabled={item.disabled}
                className={cn(itemClassName, active && itemActiveClassName)}
                onBlur={() => callbacks.onBlur?.(item)}
              >
                <Link
                  href={item.href}
                  onClick={() => handleNavigate(item, callbacks)}
                >
                  <DashboardItemIcon item={item} />
                  <span className="truncate">{label}</span>
                </Link>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                disabled={item.disabled}
                className={cn(itemClassName, active && itemActiveClassName)}
                onClick={() => callbacks.onItemClick?.(item)}
                onBlur={() => callbacks.onBlur?.(item)}
              >
                <DashboardItemIcon item={item} />
                <span className="truncate">{label}</span>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        );
      })}
    </>
  );
}

function DashboardSidebarSubLevel({
  items,
  depth = 0,
  pathname,
  ...callbacks
}: DashboardSidebarProps & { pathname: string; depth?: number }) {
  const { itemClassName, itemActiveClassName } = callbacks.customStyles ?? {};
  const itemTitle = useDashboardItemTitle();

  return (
    <>
      {items.map((item) => {
        const active = isItemActive(pathname, item.href);
        const hasChildren = Boolean(item.children?.length);
        const label = itemTitle(item);

        if (hasChildren) {
          return (
            <Collapsible
              key={item.id}
              defaultOpen={active}
              onOpenChange={(open) => {
                callbacks.onToggle?.(item);
                if (open) callbacks.onExpand?.(item);
                else callbacks.onCollapse?.(item);
              }}
            >
              <SidebarMenuSubItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuSubButton
                    className={cn(
                      itemClassName,
                      active && itemActiveClassName,
                      "data-[state=open]:*:data-[slot=dashboard-chevron]:rotate-90",
                    )}
                    onBlur={() => callbacks.onBlur?.(item)}
                  >
                    <DashboardItemIcon item={item} />
                    <span className="truncate">{label}</span>
                    <ChevronRight
                      data-slot="dashboard-chevron"
                      className="ml-auto size-4 shrink-0 transition-transform duration-200"
                    />
                  </SidebarMenuSubButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub className="mx-0 mr-0 ml-2 pl-2">
                    <DashboardSidebarSubLevel
                      items={item.children ?? []}
                      depth={depth + 1}
                      pathname={pathname}
                      {...callbacks}
                    />
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuSubItem>
            </Collapsible>
          );
        }

        return (
          <SidebarMenuSubItem key={item.id}>
            {item.href ? (
              <SidebarMenuSubButton
                asChild
                isActive={active}
                className={cn(
                  itemClassName,
                  active && itemActiveClassName,
                  item.disabled && "pointer-events-none opacity-50",
                )}
                onBlur={() => callbacks.onBlur?.(item)}
              >
                <Link
                  href={item.href}
                  aria-disabled={item.disabled}
                  onClick={(event) => {
                    if (item.disabled) {
                      event.preventDefault();
                      return;
                    }
                    handleNavigate(item, callbacks);
                  }}
                >
                  <DashboardItemIcon item={item} />
                  <span className="truncate">{label}</span>
                </Link>
              </SidebarMenuSubButton>
            ) : (
              <SidebarMenuSubButton
                asChild
                className={cn(itemClassName, active && itemActiveClassName)}
                onBlur={() => callbacks.onBlur?.(item)}
              >
                <button
                  type="button"
                  disabled={item.disabled}
                  className="flex w-full min-w-0 items-center gap-2"
                  onClick={() => callbacks.onItemClick?.(item)}
                >
                  <DashboardItemIcon item={item} />
                  <span className="truncate">{label}</span>
                </button>
              </SidebarMenuSubButton>
            )}
          </SidebarMenuSubItem>
        );
      })}
    </>
  );
}

/**
 * Permission-filtered dashboard nav. When sidebar is collapsed, only root icons
 * are rendered (no nested child subtrees).
 */
export function DashboardSidebar({
  items,
  customStyles,
  onItemClick,
  onNavigate,
  onToggle,
  onExpand,
  onCollapse,
  onBlur,
  onKeyDown,
  onKeyUp,
}: DashboardSidebarProps) {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const menuState = isMobile ? "expanded" : state;
  const pathname = usePathname();
  const callbacks = {
    customStyles,
    onItemClick,
    onNavigate,
    onToggle,
    onExpand,
    onCollapse,
    onBlur,
    onKeyDown,
    onKeyUp,
    closeMobileMenu: () => {
      if (isMobile) setOpenMobile(false);
    },
  };

  return (
    <SidebarGroup className="p-2" onKeyDown={onKeyDown} onKeyUp={onKeyUp}>
      {menuState === "collapsed" ? (
        <DashboardSidebarCollapsed
          items={items}
          pathname={pathname}
          {...callbacks}
        />
      ) : (
        <SidebarMenu>
          <DashboardSidebarLevel
            items={items}
            pathname={pathname}
            {...callbacks}
          />
        </SidebarMenu>
      )}
    </SidebarGroup>
  );
}
