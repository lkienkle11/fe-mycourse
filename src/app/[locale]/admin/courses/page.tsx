import { redirect } from "@/i18n/navigation";
import { adminCoursesAllHref } from "@/lib/navigation/routes";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AdminCoursesIndexRoute({ params }: Props) {
  const { locale } = await params;
  redirect({ href: adminCoursesAllHref, locale });
}
