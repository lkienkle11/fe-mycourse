import { INSTRUCTOR_ROSTER_PORTFOLIO_ID_PARAM } from "@/constants/instructor-admin";
import { PRIVATE_ROUTES } from "@/constants/route";
import { redirect } from "@/i18n/navigation";
import { instructorProfilesRedirectHref } from "@/lib/navigation/instructor-roster";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminInstructorProfilesRedirectPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const query = await searchParams;
  const raw = query[INSTRUCTOR_ROSTER_PORTFOLIO_ID_PARAM];
  const portfolioId = typeof raw === "string" ? raw : undefined;

  redirect({
    href: instructorProfilesRedirectHref(
      PRIVATE_ROUTES.admin.instructors.roster,
      portfolioId,
    ),
    locale,
  });
}
