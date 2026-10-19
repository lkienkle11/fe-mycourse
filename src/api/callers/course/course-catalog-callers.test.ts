import { describe, expect, it, jest } from "@jest/globals";
import type { ApiMethods } from "@/api/core/methods";
import { createCourseReviewCallers } from "./course-factory-review";
import { getContinueLearningKey, getTrendingCoursesKey } from "./course-keys";

function buildFakeMethods(data: unknown) {
  const apiFetch = jest.fn<
    (url: string) => Promise<{ data: { data: unknown } }>
  >(async () => ({ data: { data } }));
  return {
    apiFetch,
    methods: { apiFetch: apiFetch as never } as unknown as ApiMethods,
  };
}

describe("home course keys", () => {
  it("builds the public trending URL with and without a limit", () => {
    expect(getTrendingCoursesKey()).toBe("/api/v1/catalog/courses/trending");
    expect(getTrendingCoursesKey(8)).toBe(
      "/api/v1/catalog/courses/trending?limit=8",
    );
  });

  it("builds the private continue URL and scopes only the cache key by user", () => {
    expect(getContinueLearningKey(3)).toBe(
      "/api/v1/learner-courses/continue?limit=3",
    );
    expect(getContinueLearningKey(3, "user-1")).toBe(
      "/api/v1/learner-courses/continue?limit=3#user-1",
    );
    expect(getContinueLearningKey()).toBe("/api/v1/learner-courses/continue");
  });
});

describe("createCourseReviewCallers — home lists", () => {
  it("requests trending courses with the limit as a string and returns the rows", async () => {
    const rows = [{ id: "c1", slug: "c-1", title: "C1" }];
    const { apiFetch, methods } = buildFakeMethods(rows);
    const { listTrendingCoursesService } = createCourseReviewCallers(methods);

    await expect(listTrendingCoursesService(8)).resolves.toEqual(rows);
    expect(apiFetch).toHaveBeenCalledWith(
      "/api/v1/catalog/courses/trending?limit=8",
    );
  });

  it("requests continue learning without the cache-only user fragment", async () => {
    const { apiFetch, methods } = buildFakeMethods([]);
    const { listContinueLearningService } = createCourseReviewCallers(methods);

    await listContinueLearningService(3);
    expect(apiFetch).toHaveBeenCalledWith(
      "/api/v1/learner-courses/continue?limit=3",
    );
  });

  it("treats a null data field as an empty list", async () => {
    const { methods } = buildFakeMethods(null);
    const { listTrendingCoursesService, listContinueLearningService } =
      createCourseReviewCallers(methods);

    await expect(listTrendingCoursesService()).resolves.toEqual([]);
    await expect(listContinueLearningService()).resolves.toEqual([]);
  });

  it("rejects when the request fails", async () => {
    const methods = {
      apiFetch: jest.fn(async () => {
        throw new Error("network");
      }),
    } as unknown as ApiMethods;
    const { listTrendingCoursesService } = createCourseReviewCallers(methods);

    await expect(listTrendingCoursesService(8)).rejects.toThrow("network");
  });
});
