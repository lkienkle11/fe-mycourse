import { describe, expect, it, jest } from "@jest/globals";
import type { ApiMethods } from "@/api/core/methods";
import { createInstructorCatalogCallers } from "./instructor-factory-catalog";
import { getPopularInstructorsKey } from "./instructor-factory-keys";

function buildFakeMethods(data: unknown) {
  const apiFetch = jest.fn<
    (url: string) => Promise<{ data: { data: unknown } }>
  >(async () => ({ data: { data } }));
  return {
    apiFetch,
    methods: { apiFetch: apiFetch as never } as unknown as ApiMethods,
  };
}

describe("popular instructors", () => {
  it("builds the public URL with and without a limit", () => {
    expect(getPopularInstructorsKey()).toBe(
      "/api/v1/catalog/instructors/popular",
    );
    expect(getPopularInstructorsKey(4)).toBe(
      "/api/v1/catalog/instructors/popular?limit=4",
    );
  });

  it("returns the rows and keeps the picture under the avatar key", async () => {
    const rows = [
      {
        user_id: "u1",
        display_name: "Ada",
        slug: "ada",
        avatar: "https://cdn.example.com/a.png",
        course_count: 2,
      },
    ];
    const { apiFetch, methods } = buildFakeMethods(rows);
    const { listPopularInstructorsService } =
      createInstructorCatalogCallers(methods);

    await expect(listPopularInstructorsService(4)).resolves.toEqual(rows);
    expect(apiFetch).toHaveBeenCalledWith(
      "/api/v1/catalog/instructors/popular?limit=4",
    );
  });

  it("treats a null data field as an empty list", async () => {
    const { methods } = buildFakeMethods(null);
    const { listPopularInstructorsService } =
      createInstructorCatalogCallers(methods);

    await expect(listPopularInstructorsService()).resolves.toEqual([]);
  });
});
