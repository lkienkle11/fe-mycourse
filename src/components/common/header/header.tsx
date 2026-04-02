import { Button } from "@/components/ui/button";
import { LANGUAGE_OPTIONS } from "@/constants";
import { MainLogo } from "@public/assets/icons";
import { getTranslations } from "next-intl/server";
import { SearchBar } from "@/components/shared";
import { ShoppingCart } from "lucide-react";
import { LocaleSwitcher } from "./locale-switcher";
import { AuthLayout } from "../auth-menu";

export const Header = async ({
  switchedLocale,
}: {
  switchedLocale: string;
}) => {
  const t = await getTranslations("home");
  const currentLocale = switchedLocale === "vi" ? "en" : "vi";
  const currentLabel =
    LANGUAGE_OPTIONS.find((item) => item.locale === currentLocale)?.locale ??
    "Language";

  return (
    <header className="w-full">
      <div className="container container-wrap mx-auto xl:px-4 flex w-full items-center justify-between py-4">
        <div className="flex items-center justify-center gap-1.5 cursor-pointer select-none">
          <MainLogo />
          <h1 className="text-xl font-bold bg-black bg-clip-text text-transparent">
            {t("header.title")}
          </h1>
        </div>
        <SearchBar
          placeholderText={t("search.placeholder")}
          wrapClassName="max-lg:hidden lg:w-100"
          inputClassName="text-object-black/60 placeholder:text-object-black/60"
        />
        <div className="flex items-center justify-center gap-4">
          <LocaleSwitcher currentLabel={currentLabel} />
          <Button
            variant="outline"
            className="border-none hover:cursor-pointer hover:scale-120 transition-all duration-300"
          >
            <ShoppingCart fill="var(--primary)" />
          </Button>
          <AuthLayout />
        </div>
      </div>
    </header>
  );
};
