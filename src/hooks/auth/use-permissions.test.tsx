import { describe, expect, it } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import { HomeIcon } from "lucide-react";
import { HttpResponse, http } from "msw";
import { NextIntlClientProvider } from "next-intl";
import { SWRConfig } from "swr";
import { PERMISSIONS } from "@/constants/permissions";
import { useSyncMeFromAuth } from "@/hooks/auth/use-auth-store";
import enMessages from "@/messages/en";
import { buildMeResponse } from "@/test-support/fixtures/auth";
import { server } from "@/test-support/msw/server";
import type { DashboardItem } from "@/types/dashboard";
import { useFilteredDashboardItems, useHasPermission } from "./use-permissions";

const NAV_ITEMS: DashboardItem[] = [
  {
    id: "courses",
    title: "Courses",
    href: "/courses",
    icon: HomeIcon,
    permissions: [PERMISSIONS.CourseRead],
  },
  {
    id: "users",
    title: "Users",
    href: "/users",
    icon: HomeIcon,
    permissions: [PERMISSIONS.UserRead],
  },
];

function Harness() {
  useSyncMeFromAuth();
  const canReadCourses = useHasPermission(PERMISSIONS.CourseRead);
  const visibleItems = useFilteredDashboardItems(NAV_ITEMS);
  return (
    <div>
      <p data-testid="can-read-courses">{String(canReadCourses)}</p>
      <nav>
        {visibleItems.map((item) => (
          <a key={item.id} href={item.href}>
            {item.title}
          </a>
        ))}
      </nav>
    </div>
  );
}

function renderHarness() {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <Harness />
      </SWRConfig>
    </NextIntlClientProvider>,
  );
}

describe("client auth/permission lifecycle — useSyncMeFromAuth + usePermissionSet", () => {
  it("denies access and hides every permission-gated nav item on session failure (401)", async () => {
    server.use(
      // Guest 401 (no bearer) is refresh-eligible per the matrix, so the
      // transport auto-attempts a refresh too — mock it as a genuine denial
      // rather than leaving it unhandled.
      http.post(`${window.location.origin}/api/auth/refresh`, () =>
        HttpResponse.json(
          { code: 401, message: "Refresh session unauthorized", data: null },
          { status: 401 },
        ),
      ),
      http.get("*/api/v1/me", () =>
        HttpResponse.json(
          { code: 401, message: "unauthorized", data: null },
          { status: 401 },
        ),
      ),
    );

    renderHarness();

    await waitFor(() =>
      expect(screen.getByTestId("can-read-courses")).toHaveTextContent("false"),
    );
    expect(screen.queryByText("Courses")).not.toBeInTheDocument();
    expect(screen.queryByText("Users")).not.toBeInTheDocument();
  });

  it("grants access and shows only the nav items the session's permissions allow", async () => {
    server.use(
      http.get("*/api/v1/me", () =>
        HttpResponse.json({
          code: 0,
          message: "ok",
          data: buildMeResponse({ permissions: [PERMISSIONS.CourseRead] }),
        }),
      ),
    );

    renderHarness();

    await waitFor(() =>
      expect(screen.getByTestId("can-read-courses")).toHaveTextContent("true"),
    );
    expect(screen.getByText("Courses")).toBeInTheDocument();
    expect(screen.queryByText("Users")).not.toBeInTheDocument();
  });
});
