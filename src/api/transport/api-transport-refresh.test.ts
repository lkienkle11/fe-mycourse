import { describe, expect, it } from "@jest/globals";
import { HttpResponse, http } from "msw";
import {
  ApiHttpError,
  ApiRefreshValidationError,
  ApiSessionUnverifiedError,
} from "@/api/core/fetch-error";
import { ApiErrorCode } from "@/constants/api-error-code";
import { okEnvelope } from "@/test-support/msw/envelope";
import { server } from "@/test-support/msw/server";
import { createApiTransport } from "./api-transport";

const BASE_URL = "http://be.test";
const PROBE_URL = `${BASE_URL}/api/v1/probe`;

function createRuntime(input: {
  upstreamStatus?: number;
  clearSession?: () => Promise<void>;
  successfulRefresh?: boolean;
}) {
  return {
    kind: "server-writable" as const,
    readAuthCookies: () => ({ refreshToken: "r", sessionId: "s" }),
    refresh: async () => {
      if (input.successfulRefresh) {
        return {
          tokens: {
            access_token: "access-2",
            refresh_token: "refresh-2",
            session_id: "session-2",
          },
        };
      }
      throw new ApiRefreshValidationError({
        reason: "invalid-envelope",
        message: "x",
        upstreamStatus: input.upstreamStatus,
      });
    },
    persistRotatedSession: async () => {},
    ...(input.clearSession ? { clearSession: input.clearSession } : {}),
  };
}

function mockUnauthorizedProbe() {
  server.use(
    http.get(PROBE_URL, () =>
      HttpResponse.json(
        {
          code: ApiErrorCode.Unauthorized,
          message: "unauthorized",
          data: null,
        },
        { status: 401 },
      ),
    ),
  );
}

async function expectOriginalUnauthorized(
  transport: ReturnType<typeof createApiTransport>,
) {
  const error = await transport
    .request({ method: "GET", url: "/api/v1/probe" })
    .then(
      () => undefined,
      (cause: unknown) => cause,
    );

  expect(error).toBeInstanceOf(ApiHttpError);
  expect((error as ApiHttpError).response.status).toBe(401);
}

describe("server-writable refresh clearing", () => {
  it.each([
    401, 403,
  ])("clears the session once when refresh is rejected with upstream %i", async (upstreamStatus) => {
    mockUnauthorizedProbe();
    let clearCount = 0;
    const transport = createApiTransport({
      baseURL: BASE_URL,
      runtime: createRuntime({
        upstreamStatus,
        clearSession: async () => {
          clearCount += 1;
        },
      }),
    });

    await expectOriginalUnauthorized(transport);

    expect(clearCount).toBe(1);
  });

  it.each([
    500,
    undefined,
  ])("does not clear when refresh has upstream status %p", async (upstreamStatus) => {
    mockUnauthorizedProbe();
    let clearCount = 0;
    const transport = createApiTransport({
      baseURL: BASE_URL,
      runtime: createRuntime({
        upstreamStatus,
        clearSession: async () => {
          clearCount += 1;
        },
      }),
    });

    await expectOriginalUnauthorized(transport);

    expect(clearCount).toBe(0);
  });

  it("preserves the original HTTP error when clearing rejects", async () => {
    mockUnauthorizedProbe();
    let clearCount = 0;
    const transport = createApiTransport({
      baseURL: BASE_URL,
      runtime: createRuntime({
        upstreamStatus: 401,
        clearSession: async () => {
          clearCount += 1;
          throw new Error("clear failed");
        },
      }),
    });

    await expectOriginalUnauthorized(transport);

    expect(clearCount).toBe(1);
  });

  it("preserves the original HTTP error when clearSession is absent", async () => {
    mockUnauthorizedProbe();
    const transport = createApiTransport({
      baseURL: BASE_URL,
      runtime: createRuntime({ upstreamStatus: 401 }),
    });

    await expectOriginalUnauthorized(transport);
  });

  it("does not clear after a successful refresh and retry", async () => {
    let probeCount = 0;
    let clearCount = 0;
    server.use(
      http.get(PROBE_URL, ({ request }) => {
        probeCount += 1;
        if (probeCount === 1) {
          return HttpResponse.json(
            {
              code: ApiErrorCode.Unauthorized,
              message: "unauthorized",
              data: null,
            },
            { status: 401 },
          );
        }
        expect(request.headers.get("authorization")).toBe("Bearer access-2");
        return okEnvelope({ value: "ok" });
      }),
    );
    const transport = createApiTransport({
      baseURL: BASE_URL,
      runtime: createRuntime({
        successfulRefresh: true,
        clearSession: async () => {
          clearCount += 1;
        },
      }),
    });

    await expect(
      transport.request({ method: "GET", url: "/api/v1/probe" }),
    ).resolves.toMatchObject({ data: { data: { value: "ok" } } });

    expect(probeCount).toBe(2);
    expect(clearCount).toBe(0);
  });
});

describe("browser-proxy refresh outage", () => {
  function createBrowserRuntime(result: {
    outage?: "network" | "server-error";
  }) {
    return {
      kind: "browser-proxy" as const,
      refresh: async () => ({ ok: false as const, ...result }),
    };
  }

  it.each([
    "network",
    "server-error",
  ] as const)("throws an unverified 401 carrying the %s outage", async (outage) => {
    mockUnauthorizedProbe();
    const transport = createApiTransport({
      baseURL: BASE_URL,
      runtime: createBrowserRuntime({ outage }),
    });

    const error = await transport
      .request({ method: "GET", url: "/api/v1/probe" })
      .then(
        () => undefined,
        (cause: unknown) => cause,
      );

    expect(error).toBeInstanceOf(ApiSessionUnverifiedError);
    expect(error).toBeInstanceOf(ApiHttpError);
    expect((error as ApiSessionUnverifiedError).response.status).toBe(401);
    expect((error as ApiSessionUnverifiedError).outage).toBe(outage);
  });

  it("keeps the plain 401 when the refresh carries no outage", async () => {
    mockUnauthorizedProbe();
    const transport = createApiTransport({
      baseURL: BASE_URL,
      runtime: createBrowserRuntime({}),
    });

    await expectOriginalUnauthorized(transport);

    const error = await transport
      .request({ method: "GET", url: "/api/v1/probe" })
      .then(
        () => undefined,
        (cause: unknown) => cause,
      );
    expect(error).not.toBeInstanceOf(ApiSessionUnverifiedError);
  });
});
