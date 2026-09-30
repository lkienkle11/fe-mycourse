import { describe, expect, it } from "@jest/globals";
import {
  ApiHttpError,
  ApiNetworkError,
  ApiTimeoutError,
} from "@/api/core/fetch-error";
import {
  classifyApiError,
  extractApiError,
  extractRecommendedSlug,
} from "./api-error";

const request = { url: "/courses/1", method: "GET", retried: false };

function httpError(status: number, data: unknown = {}) {
  return new ApiHttpError({
    message: "http error",
    response: { status, data, headers: {} },
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

describe("extractApiError", () => {
  it("reads code and message from an ApiHttpError body", () => {
    expect(
      extractApiError(httpError(409, { code: 3005, message: "conflict" })),
    ).toEqual({ code: 3005, message: "conflict" });
  });

  it("reads code and message from a legacy response shape", () => {
    expect(
      extractApiError({
        response: { data: { code: 3004, message: "missing" } },
      }),
    ).toEqual({ code: 3004, message: "missing" });
  });

  it("falls back to the unknown code for a non-API error", () => {
    expect(extractApiError(new Error("boom")).code).toBe(9999);
  });
});

describe("extractRecommendedSlug", () => {
  const conflictBody = (data: unknown) => ({
    code: 3007,
    message: "Slug already exists",
    data,
  });

  it("returns the recommended slug for a 3007 conflict", () => {
    expect(
      extractRecommendedSlug(
        httpError(
          409,
          conflictBody({ recommended_slug: "golang-course-x7k92ab" }),
        ),
      ),
    ).toBe("golang-course-x7k92ab");
  });

  it("reads the legacy response shape", () => {
    expect(
      extractRecommendedSlug({
        response: {
          data: conflictBody({ recommended_slug: "golang-course-x7k92ab" }),
        },
      }),
    ).toBe("golang-course-x7k92ab");
  });

  it("returns undefined when data is missing or null", () => {
    expect(extractRecommendedSlug(httpError(409, conflictBody(null)))).toBe(
      undefined,
    );
    expect(
      extractRecommendedSlug(
        httpError(409, { code: 3007, message: "Slug already exists" }),
      ),
    ).toBe(undefined);
  });

  it("returns undefined for a blank or non-string recommended slug", () => {
    expect(
      extractRecommendedSlug(
        httpError(409, conflictBody({ recommended_slug: "   " })),
      ),
    ).toBe(undefined);
    expect(
      extractRecommendedSlug(
        httpError(409, conflictBody({ recommended_slug: 42 })),
      ),
    ).toBe(undefined);
  });

  it("ignores a recommended slug on any other error code", () => {
    expect(
      extractRecommendedSlug(
        httpError(409, {
          code: 3005,
          message: "conflict",
          data: { recommended_slug: "golang-course-x7k92ab" },
        }),
      ),
    ).toBe(undefined);
  });

  it("returns undefined for a non-HTTP error", () => {
    expect(extractRecommendedSlug(new Error("boom"))).toBe(undefined);
  });
});
