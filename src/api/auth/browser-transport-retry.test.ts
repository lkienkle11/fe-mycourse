import { describe, expect, it } from "@jest/globals";
import { HttpResponse, http } from "msw";
import { apiFetch } from "@/api/transport/browser-api-methods";
import { server } from "@/test-support/msw/server";

const REFRESH_URL = `${window.location.origin}/api/auth/refresh`;
const PROTECTED_PATH = "/api/v1/protected-resource";

describe("browser apiFetch — 401 refresh-and-retry (bounded)", () => {
  it("retries exactly once with the rotated token after a 401, then returns the retried result", async () => {
    let protectedCallCount = 0;
    let secondCallAuthHeader: string | null = null;

    server.use(
      http.post(REFRESH_URL, () =>
        HttpResponse.json({
          code: 0,
          message: "ok",
          data: { access_token: "rotated-token" },
        }),
      ),
      http.get(`*${PROTECTED_PATH}`, ({ request }) => {
        protectedCallCount += 1;
        if (protectedCallCount === 1) {
          return HttpResponse.json(
            { code: 401, message: "unauthorized", data: null },
            { status: 401 },
          );
        }
        secondCallAuthHeader = request.headers.get("authorization");
        return HttpResponse.json({
          code: 0,
          message: "ok",
          data: { value: "secret" },
        });
      }),
    );

    const { data } = await apiFetch<{
      code: number;
      message: string;
      data: { value: string };
    }>(PROTECTED_PATH);

    expect(protectedCallCount).toBe(2);
    expect(secondCallAuthHeader).toBe("Bearer rotated-token");
    expect(data.data).toEqual({ value: "secret" });
  });

  it("never attempts a second retry when the retried request also fails", async () => {
    let protectedCallCount = 0;
    server.use(
      http.post(REFRESH_URL, () =>
        HttpResponse.json({
          code: 0,
          message: "ok",
          data: { access_token: "rotated-token" },
        }),
      ),
      http.get(`*${PROTECTED_PATH}-still-failing`, () => {
        protectedCallCount += 1;
        return HttpResponse.json(
          { code: 401, message: "unauthorized", data: null },
          { status: 401 },
        );
      }),
    );

    await expect(
      apiFetch(`${PROTECTED_PATH}-still-failing`),
    ).rejects.toBeDefined();

    // Exactly two attempts total: the original request plus the single bounded retry.
    expect(protectedCallCount).toBe(2);
  });

  it("does not attempt a refresh at all for a non-401/403 error", async () => {
    let refreshCallCount = 0;
    let protectedCallCount = 0;
    server.use(
      http.post(REFRESH_URL, () => {
        refreshCallCount += 1;
        return HttpResponse.json({
          code: 0,
          message: "ok",
          data: { access_token: "x" },
        });
      }),
      http.get(`*${PROTECTED_PATH}-server-error`, () => {
        protectedCallCount += 1;
        return HttpResponse.json(
          { code: 500, message: "server error", data: null },
          { status: 500 },
        );
      }),
    );

    await expect(
      apiFetch(`${PROTECTED_PATH}-server-error`),
    ).rejects.toBeDefined();

    expect(protectedCallCount).toBe(1);
    expect(refreshCallCount).toBe(0);
  });
});
