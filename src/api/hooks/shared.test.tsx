import { describe, expect, it, jest } from "@jest/globals";
import { act, renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { ReactNode } from "react";
import { SWRConfig } from "swr";
import { server } from "@/test-support/msw/server";
import type { ApiPaginatedData } from "@/types/api";
import {
  useApiDetailQuery,
  useApiInfiniteListQuery,
  useApiListQuery,
} from "./shared";

function freshCacheWrapper({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      {children}
    </SWRConfig>
  );
}

function buildPage<T>(
  rows: T[],
  page: number,
  totalPages: number,
): ApiPaginatedData<T[]> {
  return {
    result: rows,
    page_info: {
      page,
      total_pages: totalPages,
      total_items: rows.length,
      per_page: rows.length,
    },
  };
}

describe("useApiListQuery", () => {
  it("is disabled (no fetch) when the key is null", () => {
    const fetcher = jest.fn<() => Promise<ApiPaginatedData<string[]>>>();
    const { result } = renderHook(
      () => useApiListQuery<string>(null, fetcher),
      { wrapper: freshCacheWrapper },
    );
    expect(result.current.isLoading).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
    expect(result.current.rows).toEqual([]);
  });

  it("reports loading, then success with rows and pageInfo", async () => {
    const page = buildPage(["a", "b"], 1, 3);
    const fetcher = jest.fn(async () => page);

    const { result } = renderHook(
      () => useApiListQuery<string>("list-key", fetcher),
      { wrapper: freshCacheWrapper },
    );

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.rows).toEqual(["a", "b"]);
    expect(result.current.pageInfo).toEqual(page.page_info);
    expect(result.current.error).toBeUndefined();
  });

  it("surfaces a rejected fetcher as an error with empty rows", async () => {
    const failure = new Error("boom");
    const fetcher = jest.fn(async () => {
      throw failure;
    });

    const { result } = renderHook(
      () =>
        useApiListQuery<string>("list-key-error", fetcher, {
          shouldRetryOnError: false,
        }),
      { wrapper: freshCacheWrapper },
    );

    await waitFor(() => expect(result.current.error).toBe(failure));
    expect(result.current.rows).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});

describe("useApiDetailQuery", () => {
  it("is disabled when the key is null and enabled once a key is provided", async () => {
    const fetcher = jest.fn(async () => ({ id: "1" }));
    const { result, rerender } = renderHook<
      ReturnType<typeof useApiDetailQuery<{ id: string }>>,
      { key: string | null }
    >(({ key }) => useApiDetailQuery(key, fetcher), {
      wrapper: freshCacheWrapper,
      initialProps: { key: null },
    });
    expect(fetcher).not.toHaveBeenCalled();

    rerender({ key: "detail-key" });
    await waitFor(() => expect(result.current.data).toEqual({ id: "1" }));
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

describe("useApiInfiniteListQuery", () => {
  // `useApiInfiniteListQuery` always fetches through the real `apiFetch` transport
  // (it hardcodes `fetchPaginatedListByKey`, ignoring any `SWRConfig` fetcher
  // override), so pages must be served through MSW rather than a stub fetcher.
  it("merges pages and deduplicates rows across pages by a row key", async () => {
    const pages: ApiPaginatedData<{ id: string }[]>[] = [
      buildPage([{ id: "1" }, { id: "2" }], 1, 2),
      buildPage([{ id: "2" }, { id: "3" }], 2, 2),
    ];
    server.use(
      http.get("*/infinite-widgets", ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get("page"));
        return HttpResponse.json({ code: 0, message: "ok", data: pages[page] });
      }),
    );

    const { result } = renderHook(
      () =>
        useApiInfiniteListQuery<{ id: string }>({
          getKey: (pageIndex, previous) => {
            if (previous && pageIndex >= pages.length) return null;
            return `/infinite-widgets?page=${pageIndex}`;
          },
          getRowKey: (row) => row.id,
        }),
      { wrapper: freshCacheWrapper },
    );

    await waitFor(() => expect(result.current.rows).toHaveLength(2));
    expect(result.current.hasMore).toBe(true);

    await waitFor(() => result.current.loadMore());
    await waitFor(() => expect(result.current.rows).toHaveLength(3));
    expect(result.current.rows.map((r) => r.id)).toEqual(["1", "2", "3"]);
    expect(result.current.hasMore).toBe(false);
  });

  it("does not start a duplicate load-more request while one is already pending", async () => {
    let resolvePage2: () => void = () => {};
    const page2Gate = new Promise<void>((resolve) => {
      resolvePage2 = resolve;
    });
    const fetchCalls: string[] = [];
    server.use(
      http.get("*/infinite-widgets-pending", async ({ request }) => {
        const page = new URL(request.url).searchParams.get("page");
        fetchCalls.push(`page-${page}`);
        if (page === "0") {
          return HttpResponse.json({
            code: 0,
            message: "ok",
            data: buildPage([{ id: "1" }], 1, 5),
          });
        }
        await page2Gate;
        return HttpResponse.json({
          code: 0,
          message: "ok",
          data: buildPage([{ id: "2" }], 2, 5),
        });
      }),
    );

    const { result } = renderHook(
      () =>
        useApiInfiniteListQuery<{ id: string }>({
          getKey: (pageIndex) => `/infinite-widgets-pending?page=${pageIndex}`,
        }),
      { wrapper: freshCacheWrapper },
    );

    await waitFor(() => expect(result.current.rows).toHaveLength(1));

    // Each call must run against a fresh render (separate `act()`) — three
    // synchronous calls sharing one stale closure would all read the same
    // `isValidating: false` and defeat the hook's own in-flight guard.
    act(() => {
      result.current.loadMore();
    });
    act(() => {
      result.current.loadMore();
    });
    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => expect(fetchCalls).toContain("page-1"));
    expect(fetchCalls.filter((k) => k === "page-1")).toHaveLength(1);

    resolvePage2();
    await waitFor(() => expect(result.current.rows).toHaveLength(2));
  });
});
