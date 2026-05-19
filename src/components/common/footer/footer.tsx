import { MainLogo } from "@public/assets/icons";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FooterSocial } from "./footer-social";

const linkClass =
  "block text-sm text-white transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-sm";

export const Footer = async () => {
  const t = await getTranslations("commonFooter");

  const col2 = [
    "webProgramming",
    "mobileProgramming",
    "javaBeginner",
    "phpBeginner",
  ] as const;
  const col3 = ["adobeIllustrator", "adobePhotoshop", "designLogo"] as const;
  const col4 = ["writingCourse", "photography", "videoMaking"] as const;

  return (
    <footer className="w-full bg-zinc-950 text-white font-gilroy">
      <div className="container container-wrap mx-auto px-4 xl:px-4">
        <div className="grid gap-10 border-b border-white/10 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="flex w-fit items-center gap-2 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-sm"
            >
              <MainLogo width={40} height={40} />
              <span className="text-lg font-bold tracking-tight">
                {t("brand")}
              </span>
            </Link>
          </div>
          <nav
            aria-label={t("navCourses")}
            className="flex flex-col gap-2.5 text-base leading-[21px] font-normal"
          >
            {col2.map((key) => (
              <Link key={key} href="#" className={linkClass}>
                {t(`links.${key}`)}
              </Link>
            ))}
          </nav>
          <nav
            aria-label={t("navDesign")}
            className="flex flex-col gap-2.5 text-base leading-[21px] font-normal"
          >
            {col3.map((key) => (
              <Link key={key} href="#" className={linkClass}>
                {t(`links.${key}`)}
              </Link>
            ))}
          </nav>
          <nav
            aria-label={t("navCreative")}
            className="flex flex-col gap-2.5 text-base leading-[21px] font-normal"
          >
            {col4.map((key) => (
              <Link key={key} href="#" className={linkClass}>
                {t(`links.${key}`)}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-400">{t("copyright")}</p>
          <FooterSocial />
        </div>
      </div>
    </footer>
  );
};
