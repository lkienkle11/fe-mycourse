import { describe, expect, it } from "@jest/globals";
import { renderHook, waitFor } from "@testing-library/react";
import { http } from "msw";
import type { ReactNode } from "react";
import { SWRConfig } from "swr";
import { okEnvelope } from "@/test-support/msw/envelope";
import { server } from "@/test-support/msw/server";
import { usePopularInstructors } from "./useInstructorCatalog";

function freshCacheWrapper({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      {children}
    </SWRConfig>
  );
}

describe("usePopularInstructors", () => {
  it("requests the limit and returns the rows", async () => {
    const urls: string[] = [];
    server.use(
      http.get("*/api/v1/catalog/instructors/popular", ({ request }) => {
        urls.push(request.url);
        return okEnvelope([
          { user_id: "u1", display_name: "Ada", slug: "", course_count: 1 },
        ]);
      }),
    );

    const { result } = renderHook(() => usePopularInstructors(4), {
      wrapper: freshCacheWrapper,
    });

    await waitFor(() => expect(result.current.rows).toHaveLength(1));
    expect(urls[0]).toContain("limit=4");
  });
});
