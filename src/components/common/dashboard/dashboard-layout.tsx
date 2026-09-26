"use client";

import { MainLogo } from "@public/assets/icons";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { BrandLogoLink } from "@/components/common/header/brand-logo-link";
import { HeaderDashboard } from "@/components/common/header/header-dashboard";
import { LocaleSwitcher } from "@/components/common/header/locale-switcher";
import { StatusErrorPage } from "@/components/shared/status-error-page";
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
import { useDashboardPageHeaderOverride } from "@/hooks/dashboard";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { resolveDashboardPageHeaderMetadata } from "@/lib/navigation/dashboard-page-header";
import { homeHref } from "@/lib/navigation/home";
import { loginHref } from "@/lib/navigation/routes";
import { cn } from "@/lib/utils";
import type { DashboardLayoutProps } from "@/types/dashboard";

import { DashboardPageHeader } from "./dashboard-page-header";
import { DashboardSidebar } from "./dashboard-sidebar";

/** Delay before the `unauthorized` denial state auto-prompts the login modal. */
const UNAUTHORIZED_AUTO_PROMPT_MS = 500;

/**
 * In-memory (not persisted) record of paths already auto-prompted this page
 * load. Dismissing the intercepted `/login` modal (`router.back()`)
 * navigates back to this same path, which remounts `DashboardLayout` (it's
 * the `children` behind the `@modal` slot, not preserved across that round
 * trip) — without this, a fresh component instance would let the 500ms
 * timer schedule and fire again immediately.
 *
 * Deliberately module-level state, not `sessionStorage`: a soft navigation
 * (the dismiss round trip above) keeps this same JS module instance alive,
 * so the mark still survives it — but an actual browser reload of the
 * denied page re-evaluates this module from scratch, clearing the mark, so
 * the auto-prompt correctly fires again on a genuine refresh instead of
 * staying silently suppressed for the rest of the tab session.
 */
const autoPromptedPaths = new Set<string | null>();

function hasAutoPromptedForPath(path: string | null): boolean {
  return autoPromptedPaths.has(path);
}

function markAutoPromptedForPath(path: string | null): void {
  autoPromptedPaths.add(path);
}

/** Test-only: clears the in-memory auto-prompt record between test cases. */
export function resetDashboardAutoPromptTracking(): void {
  autoPromptedPaths.clear();
}

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
        href={homeHref}
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

function DashboardShellContent({
  children,
  items,
  isLoading,
}: Pick<DashboardLayoutProps, "children" | "items"> & {
  isLoading: boolean;
}) {
  const pathname = usePathname();
  const t = useTranslations();
  const override = useDashboardPageHeaderOverride();
  const staticHeader = resolveDashboardPageHeaderMetadata(
    pathname,
    items,
    (key) => t(key as never),
  );
  const header = {
    breadcrumbs: override?.breadcrumbs ?? staticHeader?.breadcrumbs ?? [],
    title: override?.title ?? staticHeader?.title,
    description: override?.description ?? staticHeader?.description,
    actions: override?.actions,
  };

  return (
    <main className="flex flex-1 flex-col gap-5 px-2 py-4">
      {isLoading ? (
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      ) : (
        <>
          <DashboardPageHeader {...header} />
          {children}
        </>
      )}
    </main>
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
  const { me, isLoading: meLoading } = useGetMe();
  const isLoading = isLoadingProp ?? meLoading;
  const satisfiesLayout = useSatisfiesPermissions({
    permissions,
    permissionMode,
  });
  const canAccessDashboard = isAuthorized ?? satisfiesLayout;
  const filteredItems = useFilteredDashboardItems(items);
  const pathname = usePathname();
  const router = useRouter();

  /**
   * `unauthorized` (no session) auto-prompts the route-based login modal
   * after a short delay so the visitor sees the denial state first. Does
   * not apply to `forbidden` (authenticated, missing permission) — logging
   * in again would not help there.
   *
   * `frozenDenial` freezes the denied path at the moment the denial state
   * first appears, using React's sanctioned "store info from a previous
   * render" pattern (a `setState` call guarded by a render-time condition,
   * not a ref mutated during render). Freezing is required because once
   * `/login` is intercepted as a modal, this component stays mounted
   * underneath it (it's the `children` behind the `@modal` slot), so
   * `usePathname()` itself flips to `/login` - without freezing, the effect
   * would re-fire on that change and push to `/login?next=/login`.
   *
   * Dismissing the modal (`router.back()`) remounts this component on the
   * same denied path (it is not preserved as a live instance across that
   * round trip), so a fresh `useState`/`useRef` alone would let the prompt
   * fire again immediately - the module-level `autoPromptedPaths` record
   * (above) survives that in-place remount so it still fires at most once
   * per denied path per page load, while a genuine browser refresh clears
   * it and re-arms the prompt (see that record's own comment).
   */
  const isUnauthorized = !isLoading && !canAccessDashboard && !me;
  const [frozenDenial, setFrozenDenial] = useState<{
    active: boolean;
    path: string | null;
  }>({ active: false, path: null });
  if (isUnauthorized && !frozenDenial.active) {
    setFrozenDenial({ active: true, path: pathname });
  } else if (!isUnauthorized && frozenDenial.active) {
    setFrozenDenial({ active: false, path: null });
  }

  useEffect(() => {
    if (!frozenDenial.active || hasAutoPromptedForPath(frozenDenial.path)) {
      return;
    }
    const timer = window.setTimeout(() => {
      markAutoPromptedForPath(frozenDenial.path);
      router.push(loginHref(frozenDenial.path));
    }, UNAUTHORIZED_AUTO_PROMPT_MS);
    return () => window.clearTimeout(timer);
  }, [frozenDenial, router]);

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
      <div className="flex min-h-svh flex-col">
        <HeaderDashboard
          leading={<BrandLogoLink className="md:hidden" />}
          trailing={<DashboardHeaderLocale />}
        />
        <StatusErrorPage
          variant={me ? "forbidden" : "unauthorized"}
          fillViewport
        />
      </div>
    );
  }

  return (
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
                <DashboardSidebar items={filteredItems} {...sidebarCallbacks} />
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
            <DashboardShellContent items={items} isLoading={isLoading}>
              {children}
            </DashboardShellContent>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
