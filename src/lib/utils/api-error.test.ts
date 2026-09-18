import { describe, expect, it } from "@jest/globals";
import {
  ApiHttpError,
  ApiNetworkError,
  ApiTimeoutError,
} from "@/api/core/fetch-error";
import { classifyApiError } from "./api-error";

const request = { url: "/courses/1", method: "GET", retried: false };

function httpError(status: number) {
  return new ApiHttpError({
    message: "http error",
    response: { status, data: {}, headers: {} },
    request,
  });
}

describe("classifyApiError", () => {
  it("maps a 401 response to unauthorized", () => {
    expect(classifyApiError(httpError(401))).toBe("unauthorized");
  });

  it("maps a 403 response to forbidden", () => {
    expect(classifyApiError(httpError(403))).toBe("forbidden");
  });

  it("maps a 5xx response to server-error", () => {
    expect(classifyApiError(httpError(500))).toBe("server-error");
    expect(classifyApiError(httpError(503))).toBe("server-error");
    expect(classifyApiError(httpError(599))).toBe("server-error");
  });

  it("maps a transport-level network error to network", () => {
    expect(
      classifyApiError(new ApiNetworkError({ message: "offline", request })),
    ).toBe("network");
  });

  it("maps a transport-level timeout to network", () => {
    expect(
      classifyApiError(new ApiTimeoutError({ message: "timed out", request })),
    ).toBe("network");
  });

  it("falls back to unknown for a 404 response", () => {
    expect(classifyApiError(httpError(404))).toBe("unknown");
  });

  it("falls back to unknown for a 429 response", () => {
    expect(classifyApiError(httpError(429))).toBe("unknown");
  });

  it("falls back to unknown for a non-transport error", () => {
    expect(classifyApiError(new Error("boom"))).toBe("unknown");
    expect(classifyApiError(undefined)).toBe("unknown");
  });
});
