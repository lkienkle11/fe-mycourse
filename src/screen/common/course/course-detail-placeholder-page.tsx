import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { signedInHomeHref } from "@/lib/navigation/routes";

/** Temporary public course page until the real course detail page is built (see `course-detail-placeholder` spec). */
export function CourseDetailPlaceholderPage() {
  const t = useTranslations("home.signedIn.coursePlaceholder");

  return (
    <section className="container mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("description")}</p>
      <Button asChild className="mt-6">
        <Link href={signedInHomeHref}>{t("back")}</Link>
      </Button>
    </section>
  );
}
