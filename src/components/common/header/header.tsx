import { MainLogo } from "@public/assets/icons";
import { ShoppingCart } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AuthLayout } from "@/components/common/auth-menu";
import { LoginSignupPopup } from "@/components/common/auth-menu/auth/login-signup-popup";
import { SearchBar } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { homeHref } from "@/lib/navigation/home";
import { HeaderBrowseNav } from "./browse-nav";
import { HeaderMobileBar } from "./header-mobile-bar";
import { LocaleSwitcher } from "./locale-switcher";

export const Header = async () => {
  const t = await getTranslations("home");

  return (
    <>
      <header className="w-full sticky top-[var(--site-promo-banner-height,0px)] z-30 bg-background shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)]">
        {/* Desktop / large tablet (lg+) */}
        <div className="container container-wrap mx-auto hidden w-full items-center justify-between py-4 xl:px-4 lg:flex">
          <Link
            href={homeHref}
            className="flex cursor-pointer select-none items-center justify-center gap-1.5"
          >
            <MainLogo />
            <h1 className="text-xl font-bold bg-black bg-clip-text text-transparent">
              {t("header.title")}
            </h1>
          </Link>
          <HeaderBrowseNav />
          <SearchBar
            placeholderText={t("search.placeholder")}
            wrapClassName="lg:w-100"
            inputClassName="text-object-black/60 placeholder:text-object-black/60"
          />
          <div className="flex items-center justify-center gap-4">
            <LocaleSwitcher useCodeLabelLanguage />
            <Button
              variant="outline"
              className="border-none hover:cursor-pointer hover:scale-120 transition-all duration-300"
            >
              <ShoppingCart fill="var(--primary)" />
            </Button>
            <AuthLayout />
          </div>
        </div>

        {/* Mobile + tablet below lg */}
        <HeaderMobileBar
          title={t("header.title")}
          searchPlaceholder={t("search.placeholder")}
        />
      </header>

      {/* Auth modal portal — outside sticky header so z-index stacks above sidebar (z-200) */}
      <LoginSignupPopup />
    </>
  );
};
