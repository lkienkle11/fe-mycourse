import { describe, expect, it } from "@jest/globals";
import { HttpResponse, http } from "msw";
import { ApiErrorCode } from "@/constants/api-error-code";
import { server } from "@/test-support/msw/server";
import { handleRefreshProxy, type RefreshProxyDeps } from "./refresh-proxy";

const BASE_URL = "http://be.test";
const REFRESH_URL = `${BASE_URL}/api/v1/auth/refresh`;

function createDeps(input?: {
  refreshToken?: string;
  sessionId?: string;
  rejectPersist?: boolean;
  rejectClearSession?: boolean;
}) {
  const persisted: Array<{
    tokens: { access_token: string; refresh_token: string; session_id: string };
    refreshMaxAge?: number;
  }> = [];
  let clearSessionCallCount = 0;

  const deps: RefreshProxyDeps = {
    readAuthCookies: () => ({
      refreshToken: input && "refreshToken" in input ? input.refreshToken : "r",
      sessionId: input && "sessionId" in input ? input.sessionId : "s",
    }),
    persistSession: async (tokens, refreshMaxAge) => {
      if (input?.rejectPersist) throw new Error("persistence failed");
      persisted.push({ tokens, refreshMaxAge });
    },
    clearSession: async () => {
      clearSessionCallCount += 1;
      if (input?.rejectClearSession) throw new Error("session clear failed");
    },
    baseURL: BASE_URL,
    timeoutMs: 500,
  };

  return {
    deps,
    persisted,
    clearSessionCallCount: () => clearSessionCallCount,
  };
}

describe("handleRefreshProxy", () => {
  it("persists a successful rotation and returns only the access token", async () => {
    server.use(
      http.post(REFRESH_URL, () =>
        HttpResponse.json(
          {
            code: ApiErrorCode.Success,
            message: "ok",
            data: {
              access_token: "a2",
              refresh_token: "r2",
              session_id: "s2",
            },
          },
          {
            headers: {
              "Set-Cookie": "refresh_token=r2; Max-Age=1800; Path=/",
            },
          },
        ),
      ),
    );

    const { deps, persisted } = createDeps();
    const response = await handleRefreshProxy(deps);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      code: ApiErrorCode.Success,
      message: "ok",
      data: { access_token: "a2" },
    });
    expect(persisted).toEqual([
      {
        tokens: { access_token: "a2", refresh_token: "r2", session_id: "s2" },
        refreshMaxAge: 1800,
      },
    ]);
  });

  it.each([
    ["missing refresh token", undefined, "s"],
    ["missing session id", "r", undefined],
  ])("returns 401 Unauthorized for %s", async (_name, refreshToken, sessionId) => {
    const { deps } = createDeps({
      refreshToken,
      sessionId,
    });

    const response = await handleRefreshProxy(deps);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      code: ApiErrorCode.Unauthorized,
      message: "Refresh session unauthorized",
      data: null,
    });
  });

  it("returns 502 for an envelope with an extra key", async () => {
    server.use(
      http.post(REFRESH_URL, () =>
        HttpResponse.json({
          code: ApiErrorCode.Success,
          message: "ok",
          data: {
            access_token: "a2",
            refresh_token: "r2",
            session_id: "s2",
          },
          extra: true,
        }),
      ),
    );

    const { deps } = createDeps();
    const response = await handleRefreshProxy(deps);

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      code: ApiErrorCode.Unknown,
      message: "Refresh request failed",
      data: null,
    });
  });

  it("returns 502 when the success envelope is missing a token field", async () => {
    server.use(
      http.post(REFRESH_URL, () =>
        HttpResponse.json({
          code: ApiErrorCode.Success,
          message: "ok",
          data: { access_token: "a2", refresh_token: "r2" },
        }),
      ),
    );

    const { deps } = createDeps();
    const response = await handleRefreshProxy(deps);

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      code: ApiErrorCode.Unknown,
      message: "Refresh request failed",
      data: null,
    });
  });

  it("returns 500 InternalError when persisting the rotated session fails", async () => {
    server.use(
      http.post(REFRESH_URL, () =>
        HttpResponse.json({
          code: ApiErrorCode.Success,
          message: "ok",
          data: {
            access_token: "a2",
            refresh_token: "r2",
            session_id: "s2",
          },
        }),
      ),
    );

    const { deps } = createDeps({ rejectPersist: true });
    const response = await handleRefreshProxy(deps);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      code: ApiErrorCode.InternalError,
      message: "Refresh upstream error",
      data: null,
    });
  });

  it.each([
    [400, ApiErrorCode.BadRequest, "Refresh request was invalid"],
    [429, ApiErrorCode.TooManyRequests, "Too many refresh attempts"],
    [500, ApiErrorCode.InternalError, "Refresh upstream error"],
  ])("passes upstream %i through with a safe code and fixed message", async (status, code, message) => {
    server.use(
      http.post(REFRESH_URL, () =>
        HttpResponse.json(
          { code, message: "backend private message", data: null },
          { status },
        ),
      ),
    );

    const { deps } = createDeps();
    const response = await handleRefreshProxy(deps);
    const body = await response.json();

    expect(response.status).toBe(status);
    expect(body).toEqual({ code, message, data: null });
    expect(JSON.stringify(body)).not.toContain("backend private message");
  });

  it("returns 502 for an upstream network error", async () => {
    server.use(http.post(REFRESH_URL, () => HttpResponse.error()));

    const { deps } = createDeps();
    const response = await handleRefreshProxy(deps);

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      code: ApiErrorCode.Unknown,
      message: "Refresh request failed",
      data: null,
    });
  });

  it("returns 504 when the upstream response exceeds the timeout", async () => {
    server.use(
      http.post(REFRESH_URL, async () => {
        await new Promise((resolve) => setTimeout(resolve, 600));
        return HttpResponse.json({
          code: ApiErrorCode.Success,
          message: "ok",
          data: {
            access_token: "a2",
            refresh_token: "r2",
            session_id: "s2",
          },
        });
      }),
    );

    const { deps } = createDeps();
    const response = await handleRefreshProxy(deps);

    expect(response.status).toBe(504);
    await expect(response.json()).resolves.toEqual({
      code: ApiErrorCode.Unknown,
      message: "Refresh request failed",
      data: null,
    });
  });

  it.each([
    [
      401,
      ApiErrorCode.Unauthorized,
      ApiErrorCode.Unauthorized,
      "Refresh session unauthorized",
    ],
    [
      403,
      ApiErrorCode.UserDisabled,
      ApiErrorCode.Unknown,
      "Refresh request failed",
    ],
  ] as const)("clears the session and returns a safe marked response for upstream %i", async (status, upstreamCode, safeCode, safeMessage) => {
    server.use(
      http.post(REFRESH_URL, () =>
        HttpResponse.json(
          { code: upstreamCode, message: "secret-be-message", data: null },
          { status },
        ),
      ),
    );

    const { deps, clearSessionCallCount } = createDeps();
    const response = await handleRefreshProxy(deps);
    const body = await response.json();

    expect(response.status).toBe(status);
    expect(body).toEqual({
      code: safeCode,
      message: safeMessage,
      data: null,
      session_cleared: true,
    });
    expect(JSON.stringify(body)).not.toContain("secret-be-message");
    expect(clearSessionCallCount()).toBe(1);
  });

  it.each([
    [400, ApiErrorCode.BadRequest],
    [429, ApiErrorCode.TooManyRequests],
    [500, ApiErrorCode.InternalError],
  ] as const)("does not clear for upstream %i", async (status, code) => {
    server.use(
      http.post(REFRESH_URL, () =>
        HttpResponse.json(
          { code, message: "backend message", data: null },
          { status },
        ),
      ),
    );

    const { deps, clearSessionCallCount } = createDeps();
    const response = await handleRefreshProxy(deps);
    const body = await response.json();

    expect(response.status).toBe(status);
    expect(body).not.toHaveProperty("session_cleared");
    expect(clearSessionCallCount()).toBe(0);
  });

  it("does not clear after an upstream network error", async () => {
    server.use(http.post(REFRESH_URL, () => HttpResponse.error()));

    const { deps, clearSessionCallCount } = createDeps();
    const response = await handleRefreshProxy(deps);
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).not.toHaveProperty("session_cleared");
    expect(clearSessionCallCount()).toBe(0);
  });

  it("does not clear after an upstream timeout", async () => {
    server.use(
      http.post(REFRESH_URL, async () => {
        await new Promise((resolve) => setTimeout(resolve, 600));
        return HttpResponse.json({
          code: ApiErrorCode.Success,
          message: "ok",
          data: {},
        });
      }),
    );

    const { deps, clearSessionCallCount } = createDeps();
    const response = await handleRefreshProxy(deps);
    const body = await response.json();

    expect(response.status).toBe(504);
    expect(body).not.toHaveProperty("session_cleared");
    expect(clearSessionCallCount()).toBe(0);
  });

  it.each([
    ["refresh token", { refreshToken: undefined }],
    ["session id", { sessionId: undefined }],
  ] as const)("does not clear when the %s is missing", async (_name, input) => {
    const { deps, clearSessionCallCount } = createDeps(input);
    const response = await handleRefreshProxy(deps);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).not.toHaveProperty("session_cleared");
    expect(clearSessionCallCount()).toBe(0);
  });

  it("does not mark the response when clearing rejects", async () => {
    server.use(
      http.post(REFRESH_URL, () =>
        HttpResponse.json(
          {
            code: ApiErrorCode.Unauthorized,
            message: "secret-be-message",
            data: null,
          },
          { status: 401 },
        ),
      ),
    );

    const { deps, clearSessionCallCount } = createDeps({
      rejectClearSession: true,
    });
    const response = await handleRefreshProxy(deps);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).not.toHaveProperty("session_cleared");
    expect(clearSessionCallCount()).toBe(1);
  });

  it("does not clear after a successful rotation", async () => {
    server.use(
      http.post(REFRESH_URL, () =>
        HttpResponse.json({
          code: ApiErrorCode.Success,
          message: "ok",
          data: {
            access_token: "a2",
            refresh_token: "r2",
            session_id: "s2",
          },
        }),
      ),
    );

    const { deps, clearSessionCallCount } = createDeps();
    const response = await handleRefreshProxy(deps);

    expect(response.status).toBe(200);
    expect(clearSessionCallCount()).toBe(0);
  });
});
