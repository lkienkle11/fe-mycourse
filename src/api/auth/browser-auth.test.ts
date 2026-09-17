import { describe, expect, it } from "@jest/globals";
import { HttpResponse, http } from "msw";
import { server } from "@/test-support/msw/server";
import { refreshBrowserSession } from "./browser-auth";

const REFRESH_URL = `${window.location.origin}/api/auth/refresh`;

describe("refreshBrowserSession", () => {
  it("returns the rotated access token on success", async () => {
    server.use(
      http.post(REFRESH_URL, () =>
        HttpResponse.json({
          code: 0,
          message: "ok",
          data: { access_token: "new-access-token" },
        }),
      ),
    );

    const result = await refreshBrowserSession();

    expect(result).toEqual({ ok: true, accessToken: "new-access-token" });
  });

  it("reports failure (denial) on a non-2xx response without throwing", async () => {
    server.use(
      http.post(REFRESH_URL, () =>
        HttpResponse.json(
          { code: 401, message: "Refresh session unauthorized", data: null },
          { status: 401 },
        ),
      ),
    );

    const result = await refreshBrowserSession();

    expect(result.ok).toBe(false);
  });

  it("reports failure on a malformed success envelope (extra data key)", async () => {
    server.use(
      http.post(REFRESH_URL, () =>
        HttpResponse.json({
          code: 0,
          message: "ok",
          data: { access_token: "new-access-token", extra: "unexpected" },
        }),
      ),
    );

    const result = await refreshBrowserSession();

    expect(result.ok).toBe(false);
  });

  it("shares one in-flight request across concurrent callers (single-flight)", async () => {
    let requestCount = 0;
    server.use(
      http.post(REFRESH_URL, async () => {
        requestCount += 1;
        await new Promise((resolve) => setTimeout(resolve, 10));
        return HttpResponse.json({
          code: 0,
          message: "ok",
          data: { access_token: "shared-token" },
        });
      }),
    );

    const [first, second, third] = await Promise.all([
      refreshBrowserSession(),
      refreshBrowserSession(),
      refreshBrowserSession(),
    ]);

    expect(requestCount).toBe(1);
    expect(first).toEqual(second);
    expect(second).toEqual(third);
  });

  it("starts a new request once the previous in-flight refresh has settled", async () => {
    let requestCount = 0;
    server.use(
      http.post(REFRESH_URL, () => {
        requestCount += 1;
        return HttpResponse.json({
          code: 0,
          message: "ok",
          data: { access_token: `token-${requestCount}` },
        });
      }),
    );

    const first = await refreshBrowserSession();
    const second = await refreshBrowserSession();

    expect(requestCount).toBe(2);
    expect(first).not.toEqual(second);
  });
});
