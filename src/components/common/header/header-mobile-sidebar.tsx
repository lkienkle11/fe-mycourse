"use client";

import { MainLogo } from "@public/assets/icons";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { BrowseSidebarMenu } from "@/components/common/header/browse-sidebar-menu";
import { LocaleSwitcher } from "@/components/common/header/locale-switcher";
import { SidebarAuthFooter } from "@/components/common/header/sidebar-auth-footer";
import { SearchBar } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { BROWSE_MENU_ITEMS } from "@/constants/browse-menu";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export interface HeaderMobileSidebarProps {
  title: string;
  searchPlaceholder: string;
}

/**
 * Mobile nav drawer: full-screen dimmed backdrop + right panel overlay.
 * Does not use Radix Sheet (avoids aria-hidden on page content behind).
 * Slide/fade use Tailwind transitions only — overlay stays mounted, `open` toggles classes.
 */
export function HeaderMobileSidebar({
  title,
  searchPlaceholder,
}: HeaderMobileSidebarProps) {
  const t = useTranslations("commonHeader");
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const closeSidebar = () => setOpen(false);

  const overlay =
    mounted && typeof document !== "undefined"
      ? createPortal(
          <div
            className={cn(
              "fixed inset-0 z-200 lg:hidden",
              !open && "pointer-events-none",
            )}
            inert={!open ? true : undefined}
          >
            {/* Backdrop: page stays visible underneath, dimmed + blurred */}
            <button
              type="button"
              tabIndex={open ? 0 : -1}
              aria-hidden={!open}
              className={cn(
                "absolute inset-0 size-full cursor-default bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-out",
                open ? "opacity-100" : "opacity-0",
              )}
              aria-label={t("menu.close")}
              onClick={closeSidebar}
            />

            {/* Panel slides on top of backdrop — does not replace page layout */}
            <aside
              role="dialog"
              aria-modal={open}
              aria-hidden={!open}
              aria-labelledby="mobile-sidebar-title"
              className={cn(
                "absolute inset-y-0 right-0 z-202 flex h-dvh max-h-dvh w-[min(320px,85vw)] max-w-[320px] flex-col border-l bg-background shadow-xl transition-transform duration-300 ease-out",
                open ? "translate-x-0" : "translate-x-full",
              )}
            >
              <div className="flex items-center justify-between border-b border-black/8 px-4 py-4">
                <Link
                  href="/"
                  onClick={closeSidebar}
                  className="flex flex-row items-center gap-1.5"
                >
                  <MainLogo />
                  <span
                    id="mobile-sidebar-title"
                    className="text-xl font-bold bg-black bg-clip-text text-transparent"
                  >
                    {title}
                  </span>
                </Link>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("menu.close")}
                  onClick={closeSidebar}
                >
                  <X className="size-5" aria-hidden />
                </Button>
              </div>

              <div className="scrollbar-app min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
                <div className="flex flex-col gap-4 px-4 py-4">
                  <SearchBar
                    visibility="sidebar"
                    placeholderText={searchPlaceholder}
                    inputClassName="text-object-black/60 placeholder:text-object-black/60"
                  />

                  <section aria-labelledby="sidebar-browse-heading">
                    <h2
                      id="sidebar-browse-heading"
                      className="mb-2 text-sm font-semibold text-foreground"
                    >
                      {t("browse.categoriesTitle")}
                    </h2>
                    <BrowseSidebarMenu
                      items={BROWSE_MENU_ITEMS}
                      onLinkClick={closeSidebar}
                    />
                  </section>
                </div>
              </div>

              <footer className="flex shrink-0 flex-col gap-4 border-t border-black/8 px-4 py-4">
                <section aria-labelledby="sidebar-locale-heading">
                  <h2 id="sidebar-locale-heading" className="sr-only">
                    {t("menu.language")}
                  </h2>
                  <LocaleSwitcher
                    fullWidth
                    triggerClassName="justify-between"
                    onNavigate={closeSidebar}
                  />
                </section>

                <section aria-labelledby="sidebar-auth-heading">
                  <h2 id="sidebar-auth-heading" className="sr-only">
                    {t("menu.account")}
                  </h2>
                  <SidebarAuthFooter onNavigate={closeSidebar} />
                </section>
              </footer>
            </aside>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t("menu.open")}
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" aria-hidden />
      </Button>
      {overlay}
    </>
  );
}
