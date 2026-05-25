"use client";

import { MainLogo } from "@public/assets/icons";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { LoginSignupPopup } from "@/components/common/auth-menu/auth/login-signup-popup";
import { HeaderDashboard } from "@/components/common/header/header-dashboard";
import { LocaleSwitcher } from "@/components/common/header/locale-switcher";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenuSkeleton,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  useFilteredDashboardItems,
  useGetMe,
  useSatisfiesPermissions,
} from "@/hooks/auth";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { DashboardLayoutProps } from "@/types/dashboard";

import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardUnauthorized } from "./dashboard-unauthorized";

/** Aligns with `HeaderDashboard` `h-16`. Override fixed sidebar via `Sidebar` `className` only. */
const DASHBOARD_SIDEBAR_CLASSNAME =
  "!top-16 !bottom-auto !h-[calc(100svh-4rem)]";

/** Desktop row — same as `header.tsx` (`lg+`, `useCodeLabelLanguage`). */
function DashboardHeaderLocale() {
  return (
    <div className="hidden items-center justify-center lg:flex">
      <LocaleSwitcher useCodeLabelLanguage />
    </div>
  );
}

/** Mobile drawer footer — same as `header-mobile-sidebar.tsx`. */
function DashboardSidebarLocaleFooter() {
  const t = useTranslations("commonHeader");
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarFooter className="flex shrink-0 flex-col gap-4 border-t border-black/8 px-4 py-4 lg:hidden">
      <section aria-labelledby="dashboard-sidebar-locale-heading">
        <h2 id="dashboard-sidebar-locale-heading" className="sr-only">
          {t("menu.language")}
        </h2>
        <LocaleSwitcher
          fullWidth
          triggerClassName="justify-between"
          onNavigate={() => setOpenMobile(false)}
        />
      </section>
    </SidebarFooter>
  );
}

/** Burger opens mobile sheet — same icon as homepage `HeaderMobileSidebar`. */
function DashboardMenuTrigger() {
  const t = useTranslations("commonHeader");
  const { toggleSidebar, openMobile } = useSidebar();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="shrink-0 md:hidden justify-start"
      aria-label={t("menu.open")}
      aria-expanded={openMobile}
      onClick={toggleSidebar}
    >
      <Menu className="size-5" aria-hidden />
    </Button>
  );
}

/** Logo + title + close — only inside mobile sheet (`md:hidden`). */
function DashboardSidebarMobileHeader() {
  const t = useTranslations("commonHeader");
  const tHome = useTranslations("home");
  const { setOpenMobile } = useSidebar();

  const close = () => setOpenMobile(false);

  return (
    <SidebarHeader className="flex flex-row items-center justify-between gap-2 border-b border-black/8 p-0 px-4 py-4 md:hidden">
      <Link
        href="/"
        onClick={close}
        className="flex min-w-0 flex-row items-center gap-1.5"
      >
        <MainLogo />
        <span className="truncate bg-black bg-clip-text text-xl font-bold text-transparent">
          {tHome("header.title")}
        </span>
      </Link>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="shrink-0"
        aria-label={t("menu.close")}
        onClick={close}
      >
        <X className="size-5" aria-hidden />
      </Button>
    </SidebarHeader>
  );
}

export function DashboardLayout({
  children,
  items,
  isLoading: isLoadingProp,
  isAuthorized,
  permissions,
  permissionMode,
  customStyles,
  onItemClick,
  onNavigate,
  onToggle,
  onExpand,
  onCollapse,
  onBlur,
  onKeyDown,
  onKeyUp,
}: DashboardLayoutProps) {
  const { isLoading: meLoading } = useGetMe();
  const isLoading = isLoadingProp ?? meLoading;
  const satisfiesLayout = useSatisfiesPermissions({
    permissions,
    permissionMode,
  });
  const canAccessDashboard = isAuthorized ?? satisfiesLayout;
  const filteredItems = useFilteredDashboardItems(items);

  const sidebarCallbacks = {
    customStyles,
    onItemClick,
    onNavigate,
    onToggle,
    onExpand,
    onCollapse,
    onBlur,
    onKeyDown,
    onKeyUp,
  };

  if (!isLoading && !canAccessDashboard) {
    return (
      <>
        <div className="flex min-h-svh flex-col">
          <HeaderDashboard trailing={<DashboardHeaderLocale />} />
          <DashboardUnauthorized />
        </div>
        <LoginSignupPopup />
      </>
    );
  }

  return (
    <>
      <div className="flex min-h-svh flex-col">
        <SidebarProvider
          defaultOpen
          className={cn(
            "flex min-h-0 w-full flex-1 flex-col",
            customStyles?.className,
          )}
        >
          <HeaderDashboard
            leading={<DashboardMenuTrigger />}
            trailing={<DashboardHeaderLocale />}
          />
          <div className="flex min-h-0 w-full flex-1">
            <Sidebar
              collapsible="icon"
              side="left"
              className={DASHBOARD_SIDEBAR_CLASSNAME}
            >
              <DashboardSidebarMobileHeader />
              <SidebarContent className={cn(isLoading && "px-2")}>
                {isLoading ? (
                  <>
                    <SidebarMenuSkeleton showIcon widthPercent={75} />
                    <SidebarMenuSkeleton showIcon widthPercent={87} />
                  </>
                ) : (
                  <DashboardSidebar
                    items={filteredItems}
                    {...sidebarCallbacks}
                  />
                )}
              </SidebarContent>
              <DashboardSidebarLocaleFooter />
              <SidebarFooter className="hidden h-12 shrink-0 items-center gap-2 px-2 md:flex">
                {isLoading ? (
                  <SidebarMenuSkeleton showIcon widthPercent={62} />
                ) : (
                  <SidebarTrigger />
                )}
              </SidebarFooter>
            </Sidebar>
            <SidebarInset>
              <main className="flex flex-1 flex-col px-2 py-4">
                {isLoading ? (
                  <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
                ) : (
                  children
                )}
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </div>
      {!isLoading && <LoginSignupPopup />}
    </>
  );
}
