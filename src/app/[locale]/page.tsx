import { getTranslations } from "next-intl/server";
import { RegisterForm } from "@/components/demo/register-form";
import { Link } from "@/i18n/navigation";

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LocalePage({ params }: LocalePageProps) {
  const { locale } = await params;
  const t = await getTranslations("home");
  const switchedLocale = locale === "vi" ? "en" : "vi";

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-8 px-4 py-10">
      <div className="flex w-full items-center justify-between">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <Link
          href="/"
          locale={switchedLocale}
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
        >
          {t("switchLanguage")}
        </Link>
      </div>
      <RegisterForm />
    </main>
  );
}
