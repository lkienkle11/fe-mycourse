import { redirect } from "@/i18n/navigation";
import { sysadminCoursesAllHref } from "@/lib/navigation/routes";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SysadminCoursesIndexRoute({ params }: Props) {
  const { locale } = await params;
  redirect({ href: sysadminCoursesAllHref, locale });
}
