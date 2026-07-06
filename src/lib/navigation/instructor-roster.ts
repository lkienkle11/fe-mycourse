import { INSTRUCTOR_ROSTER_PORTFOLIO_ID_PARAM } from "@/constants/instructor-admin";
import { PRIVATE_ROUTES } from "@/constants/route";
import { toPrivateRoute } from "@/lib/navigation/routes";

type InstructorRosterRoute =
  | typeof PRIVATE_ROUTES.admin.instructors.roster
  | typeof PRIVATE_ROUTES.sysadmin.instructors.roster;

function resolveInstructorRosterRoute(pathname: string): InstructorRosterRoute {
  return pathname.includes("/sysadmin/")
    ? PRIVATE_ROUTES.sysadmin.instructors.roster
    : PRIVATE_ROUTES.admin.instructors.roster;
}

/** Roster URL with `portfolioId` query to open the profile modal on the same page. */
export function instructorRosterPortfolioHref(
  pathname: string,
  portfolioId: string,
): string {
  return toPrivateRoute(resolveInstructorRosterRoute(pathname), {
    [INSTRUCTOR_ROSTER_PORTFOLIO_ID_PARAM]: portfolioId,
  });
}

/** Legacy profiles path → roster (optional `portfolioId` preserved). */
export function instructorProfilesRedirectHref(
  rosterRoute: InstructorRosterRoute,
  portfolioId?: string | null,
): string {
  if (!portfolioId?.trim()) {
    return toPrivateRoute(rosterRoute);
  }
  return toPrivateRoute(rosterRoute, {
    [INSTRUCTOR_ROSTER_PORTFOLIO_ID_PARAM]: portfolioId.trim(),
  });
}
