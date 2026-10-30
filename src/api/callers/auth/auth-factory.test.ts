import { describe, expect, it } from "@jest/globals";
import {
  ApiHttpError,
  ApiSessionUnverifiedError,
} from "@/api/core/fetch-error";
import type { ApiMethods } from "@/api/core/methods";
import { createAuthCallers } from "./auth-factory";

const request = { url: "/api/v1/me", method: "GET", retried: false };
const response = { status: 401, data: {}, headers: {} };

function callersFailingWith(error: unknown) {
  const methods = {
    apiFetch: async () => {
      throw error;
    },
  } as unknown as ApiMethods;
  return createAuthCallers(methods);
}

describe("getMeService", () => {
  it("returns null for a plain 401 (guest)", async () => {
    const error = new ApiHttpError({ message: "HTTP 401", response, request });

    await expect(callersFailingWith(error).getMeService()).resolves.toBeNull();
  });

  it.each([
    "network",
    "server-error",
  ] as const)("rethrows a 401 whose refresh did not conclude (%s)", async (outage) => {
    const error = new ApiSessionUnverifiedError({
      message: "HTTP 401",
      response,
      request,
      outage,
    });

    await expect(callersFailingWith(error).getMeService()).rejects.toBe(error);
  });

  it("rethrows a 5xx response", async () => {
    const error = new ApiHttpError({
      message: "HTTP 500",
      response: { ...response, status: 500 },
      request,
    });

    await expect(callersFailingWith(error).getMeService()).rejects.toBe(error);
  });
});
