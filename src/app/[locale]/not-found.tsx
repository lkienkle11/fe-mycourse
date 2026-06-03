import { getTranslations } from "next-intl/server";
import { NotFoundPage } from "@/screen/common/not-found/not-found-page";

export async function generateMetadata() {
  const t = await getTranslations("notFound");
  return { title: t("metaTitle") };
}

export default function NotFound() {
  return <NotFoundPage />;
}
