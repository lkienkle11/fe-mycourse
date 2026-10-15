import { describe, expect, it } from "@jest/globals";
import {
  ADMIN_DASHBOARD_ITEMS,
  INSTRUCTOR_DASHBOARD_ITEMS,
} from "@/constants/dashboard";
import { resolveDashboardPageHeaderMetadata } from "./dashboard-page-header";

const translate = (key: string) => `t:${key}`;

describe("resolveDashboardPageHeaderMetadata", () => {
  it("returns null when no header route matches the pathname", () => {
    expect(
      resolveDashboardPageHeaderMetadata(
        "/admin/not-a-route",
        ADMIN_DASHBOARD_ITEMS,
        translate,
      ),
    ).toBeNull();
  });

  it("builds the breadcrumb chain from the nav tree down to the matching item", () => {
    const metadata = resolveDashboardPageHeaderMetadata(
      "/admin/taxonomy/levels",
      ADMIN_DASHBOARD_ITEMS,
      translate,
    );

    expect(metadata?.title).toBe("t:taxonomy.resources.levels.title");
    expect(metadata?.breadcrumbs.map((crumb) => crumb.key)).toEqual([
      "admin-root",
      "admin-taxonomy",
      "admin-taxonomy-levels",
    ]);
    expect(metadata?.breadcrumbs[0].href).toBe("/admin");
    expect(metadata?.breadcrumbs[2].href).toBe("/admin/taxonomy/levels");
  });

  it("anchors dynamic routes to their breadcrumbHref item", () => {
    const metadata = resolveDashboardPageHeaderMetadata(
      "/instructor/courses/course-1/info",
      INSTRUCTOR_DASHBOARD_ITEMS,
      translate,
    );

    const crumbs = metadata?.breadcrumbs ?? [];
    expect(crumbs[0]?.href).toBe("/instructor");
    expect(crumbs[crumbs.length - 1]?.href).toBe("/instructor/courses");
  });

  it("returns only the role root for a role-root route", () => {
    const metadata = resolveDashboardPageHeaderMetadata(
      "/admin",
      ADMIN_DASHBOARD_ITEMS,
      translate,
    );

    expect(metadata?.breadcrumbs.map((crumb) => crumb.key)).toEqual([
      "admin-root",
    ]);
  });
});
