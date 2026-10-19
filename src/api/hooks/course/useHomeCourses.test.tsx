import { describe, expect, it, jest } from "@jest/globals";
import { renderHook, waitFor } from "@testing-library/react";
import { http } from "msw";
import type { ReactNode } from "react";
import { SWRConfig } from "swr";
import { okEnvelope } from "@/test-support/msw/envelope";
import { server } from "@/test-support/msw/server";
import { useContinueLearning, useTrendingCourses } from "./useCourses";

function freshCacheWrapper({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      {children}
    </SWRConfig>
  );
}

describe("useTrendingCourses", () => {
  it("requests the limit and returns the rows", async () => {
    const urls: string[] = [];
    server.use(
      http.get("*/api/v1/catalog/courses/trending", ({ request }) => {
        urls.push(request.url);
        return okEnvelope([{ id: "c1", slug: "c-1", title: "C1" }]);
      }),
    );

    const { result } = renderHook(() => useTrendingCourses(8), {
      wrapper: freshCacheWrapper,
    });

    await waitFor(() => expect(result.current.rows).toHaveLength(1));
    expect(urls[0]).toContain("limit=8");
  });
});

describe("useContinueLearning", () => {
  it("makes no request without a user id", async () => {
    const handler = jest.fn(() => okEnvelope([]));
    server.use(http.get("*/api/v1/learner-courses/continue", handler));

    const { result } = renderHook(() => useContinueLearning(3, null), {
      wrapper: freshCacheWrapper,
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.rows).toEqual([]);
    expect(handler).not.toHaveBeenCalled();
  });

  it("fetches for a user and never reuses another user's rows", async () => {
    let call = 0;
    server.use(
      http.get("*/api/v1/learner-courses/continue", () => {
        call += 1;
        return okEnvelope([
          {
            course_id: `course-of-call-${call}`,
            slug: "s",
            title: "T",
            completed_sub_lessons: 0,
            total_sub_lessons: 1,
            progress_percent: 0,
            last_activity_at: 1,
          },
        ]);
      }),
    );

    const { result, rerender } = renderHook(
      ({ userId }: { userId: string }) => useContinueLearning(3, userId),
      { wrapper: freshCacheWrapper, initialProps: { userId: "user-a" } },
    );
    await waitFor(() =>
      expect(result.current.rows[0]?.course_id).toBe("course-of-call-1"),
    );

    rerender({ userId: "user-b" });
    expect(result.current.rows).toEqual([]);
    await waitFor(() =>
      expect(result.current.rows[0]?.course_id).toBe("course-of-call-2"),
    );
  });
});
