import { getTranslations } from "next-intl/server";
import { robotsPreset } from "@/lib/seo/robots-presets";
import { CourseDetailPlaceholderPage } from "@/screen";

export async function generateMetadata() {
  const t = await getTranslations("home.signedIn.coursePlaceholder");
  return {
    title: t("title"),
    robots: robotsPreset("noindex"),
  };
}

export default function CourseDetailRoutePage() {
  return <CourseDetailPlaceholderPage />;
}
