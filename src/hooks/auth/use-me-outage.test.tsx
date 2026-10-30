import { describe, expect, it, jest } from "@jest/globals";
import { renderHook } from "@testing-library/react";
import {
  ApiHttpError,
  ApiNetworkError,
  ApiSessionUnverifiedError,
} from "@/api/core/fetch-error";
import { useMeStore } from "@/store/auth";
import { buildMeResponse } from "@/test-support/fixtures/auth";
import { useMeOutage } from "./use-me-outage";

const request = { url: "/api/v1/me", method: "GET", retried: false };

function httpError(status: number) {
  return new ApiHttpError({
    message: `HTTP ${status}`,
    response: { status, data: {}, headers: {} },
    request,
  });
}

function setMe(state: Partial<ReturnType<typeof useMeStore.getState>>) {
  useMeStore.setState({ me: null, isLoading: false, ...state });
}

describe("useMeOutage", () => {
  it.each([
    ["a 500 response", httpError(500), "server-error"],
    [
      "a network failure",
      new ApiNetworkError({ message: "x", request }),
      "network",
    ],
    [
      "a 401 whose refresh did not conclude",
      new ApiSessionUnverifiedError({
        message: "HTTP 401",
        response: { status: 401, data: {}, headers: {} },
        request,
        outage: "server-error",
      }),
      "server-error",
    ],
  ] as const)("reports an outage for %s", (_label, error, variant) => {
    setMe({ isError: error });

    const { result } = renderHook(() => useMeOutage());

    expect(result.current?.variant).toBe(variant);
  });

  it("retries by revalidating the current user", () => {
    const mutateMe = jest.fn();
    setMe({ isError: httpError(503), mutateMe });

    const { result } = renderHook(() => useMeOutage());
    result.current?.retry();

    expect(mutateMe).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["no error", undefined],
    ["a 403 response", httpError(403)],
    ["a 404 response", httpError(404)],
  ] as const)("is null for %s", (_label, error) => {
    setMe({ isError: error });

    const { result } = renderHook(() => useMeOutage());

    expect(result.current).toBeNull();
  });

  it("is null while the current user is loading", () => {
    setMe({ isLoading: true, isError: httpError(500) });

    const { result } = renderHook(() => useMeOutage());

    expect(result.current).toBeNull();
  });

  it("is null when a cached user is still shown", () => {
    setMe({ me: buildMeResponse(), isError: httpError(500) });

    const { result } = renderHook(() => useMeOutage());

    expect(result.current).toBeNull();
  });
});
