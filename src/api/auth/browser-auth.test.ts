import { afterEach, describe, expect, it } from "@jest/globals";
import { HttpResponse, http } from "msw";
import { server } from "@/test-support/msw/server";
import { refreshBrowserSession } from "./browser-auth";

const REFRESH_URL = `${window.location.origin}/api/auth/refresh`;
const originalLocksDescriptor = Object.getOwnPropertyDescriptor(
  navigator,
  "locks",
);

afterEach(() => {
  if (originalLocksDescriptor) {
    Object.defineProperty(navigator, "locks", originalLocksDescriptor);
  } else {
    Reflect.deleteProperty(navigator, "locks");
  }
});

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

  it("returns the session-cleared marker and notifies once", async () => {
    let callbackCount = 0;
    server.use(
      http.post(REFRESH_URL, () =>
        HttpResponse.json(
          {
            code: 401,
            message: "Refresh session unauthorized",
            data: null,
            session_cleared: true,
          },
          { status: 401 },
        ),
      ),
    );

    const result = await refreshBrowserSession(() => {
      callbackCount += 1;
    });

    expect(result).toMatchObject({
      ok: false,
      sessionCleared: true,
      cause: expect.anything(),
    });
    expect(callbackCount).toBe(1);
  });

  it("does not notify when an unauthorized response has no marker", async () => {
    let callbackCount = 0;
    server.use(
      http.post(REFRESH_URL, () =>
        HttpResponse.json(
          { code: 401, message: "Refresh session unauthorized", data: null },
          { status: 401 },
        ),
      ),
    );

    const result = await refreshBrowserSession(() => {
      callbackCount += 1;
    });

    expect(result).not.toHaveProperty("sessionCleared");
    expect(callbackCount).toBe(0);
  });

  it("notifies once for three concurrent callers sharing a cleared refresh", async () => {
    let callbackCount = 0;
    let requestCount = 0;
    server.use(
      http.post(REFRESH_URL, async () => {
        requestCount += 1;
        await new Promise((resolve) => setTimeout(resolve, 10));
        return HttpResponse.json(
          {
            code: 401,
            message: "Refresh session unauthorized",
            data: null,
            session_cleared: true,
          },
          { status: 401 },
        );
      }),
    );

    const [first, second, third] = await Promise.all([
      refreshBrowserSession(() => {
        callbackCount += 1;
      }),
      refreshBrowserSession(() => {
        callbackCount += 1;
      }),
      refreshBrowserSession(() => {
        callbackCount += 1;
      }),
    ]);

    expect(requestCount).toBe(1);
    expect(callbackCount).toBe(1);
    expect(first).toMatchObject({ ok: false, sessionCleared: true });
    expect(second).toEqual(first);
    expect(third).toEqual(first);
  });

  it("does not notify after a successful refresh", async () => {
    let callbackCount = 0;
    server.use(
      http.post(REFRESH_URL, () =>
        HttpResponse.json({
          code: 0,
          message: "ok",
          data: { access_token: "new-access-token" },
        }),
      ),
    );

    const result = await refreshBrowserSession(() => {
      callbackCount += 1;
    });

    expect(result).toEqual({ ok: true, accessToken: "new-access-token" });
    expect(callbackCount).toBe(0);
  });

  it("keeps the failed result when the session-cleared callback throws", async () => {
    let callbackCount = 0;
    server.use(
      http.post(REFRESH_URL, () =>
        HttpResponse.json(
          {
            code: 401,
            message: "Refresh session unauthorized",
            data: null,
            session_cleared: true,
          },
          { status: 401 },
        ),
      ),
    );

    const result = await refreshBrowserSession(() => {
      callbackCount += 1;
      throw new Error("callback failed");
    });

    expect(result).toMatchObject({
      ok: false,
      sessionCleared: true,
      cause: expect.anything(),
    });
    expect(callbackCount).toBe(1);
  });

  it("uses the cross-tab refresh lock and waits until it is granted", async () => {
    const lockNames: string[] = [];
    let releaseLock: (() => void) | undefined;
    let postCount = 0;
    Object.defineProperty(navigator, "locks", {
      configurable: true,
      value: {
        request: (name: string, task: () => Promise<unknown>) => {
          lockNames.push(name);
          return new Promise((resolve, reject) => {
            releaseLock = () => {
              Promise.resolve(task()).then(resolve, reject);
            };
          });
        },
      },
    });
    server.use(
      http.post(REFRESH_URL, () => {
        postCount += 1;
        return HttpResponse.json({
          code: 0,
          message: "ok",
          data: { access_token: "locked-token" },
        });
      }),
    );

    const pending = refreshBrowserSession();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const lockNamesBeforeGrant = [...lockNames];
    const postCountBeforeGrant = postCount;
    releaseLock?.();
    const result = await pending;

    expect(lockNamesBeforeGrant).toEqual(["mycourse:auth-refresh"]);
    expect(postCountBeforeGrant).toBe(0);
    expect(postCount).toBe(1);
    expect(result).toEqual({ ok: true, accessToken: "locked-token" });
  });

  it("allows a refresh after the lock request rejects", async () => {
    let lockRequestCount = 0;
    let postCount = 0;
    Object.defineProperty(navigator, "locks", {
      configurable: true,
      value: {
        request: (_name: string, task: () => Promise<unknown>) => {
          lockRequestCount += 1;
          if (lockRequestCount === 1) {
            return Promise.reject(new Error("lock task rejected"));
          }
          return task();
        },
      },
    });
    server.use(
      http.post(REFRESH_URL, () => {
        postCount += 1;
        return HttpResponse.json({
          code: 0,
          message: "ok",
          data: { access_token: "next-token" },
        });
      }),
    );

    await expect(refreshBrowserSession()).rejects.toThrow("lock task rejected");
    const result = await refreshBrowserSession();

    expect(lockRequestCount).toBe(2);
    expect(postCount).toBe(1);
    expect(result).toEqual({ ok: true, accessToken: "next-token" });
  });

  it("falls back without navigator.locks and still shares concurrent callers", async () => {
    let requestCount = 0;
    Object.defineProperty(navigator, "locks", {
      configurable: true,
      value: undefined,
    });
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

    const results = await Promise.all([
      refreshBrowserSession(),
      refreshBrowserSession(),
      refreshBrowserSession(),
    ]);

    expect(requestCount).toBe(1);
    expect(results[0]).toEqual(results[1]);
    expect(results[1]).toEqual(results[2]);
  });
});

describe("refreshBrowserSession outage", () => {
  it.each([
    [500, "server-error"],
    [502, "server-error"],
    [429, "server-error"],
  ] as const)("flags an outage for proxy status %i", async (status, outage) => {
    server.use(
      http.post(REFRESH_URL, () =>
        HttpResponse.json(
          { code: status, message: "fixed", data: null },
          { status },
        ),
      ),
    );

    const result = await refreshBrowserSession();

    expect(result).toMatchObject({ ok: false, outage });
  });

  it.each([
    400, 401, 403,
  ])("flags no outage for proxy status %i", async (status) => {
    server.use(
      http.post(REFRESH_URL, () =>
        HttpResponse.json(
          { code: status, message: "fixed", data: null },
          { status },
        ),
      ),
    );

    const result = await refreshBrowserSession();

    expect(result.ok).toBe(false);
    expect(result).not.toHaveProperty("outage");
  });

  it("flags a network outage when the proxy cannot be reached", async () => {
    server.use(http.post(REFRESH_URL, () => HttpResponse.error()));

    const result = await refreshBrowserSession();

    expect(result).toMatchObject({ ok: false, outage: "network" });
  });
});
