import { describe, expect, it } from "@jest/globals";
import { HttpResponse, http } from "msw";
import { server } from "@/test-support/msw/server";
import { ApiRefreshValidationError } from "../core/fetch-error";
import { refreshUpstreamSession } from "./server-auth";

const BASE_URL = "http://be.test";
const REFRESH_URL = `${BASE_URL}/api/v1/auth/refresh`;

describe("refreshUpstreamSession", () => {
  it.each([
    401, 403, 500,
  ])("preserves upstream status %i on validation errors", async (upstreamStatus) => {
    server.use(
      http.post(REFRESH_URL, () =>
        HttpResponse.json(
          { code: 9999, message: "upstream error", data: null },
          { status: upstreamStatus },
        ),
      ),
    );

    let error: unknown;
    try {
      await refreshUpstreamSession(
        { refreshToken: "r", sessionId: "s" },
        BASE_URL,
      );
    } catch (cause) {
      error = cause;
    }

    expect(error).toBeInstanceOf(ApiRefreshValidationError);
    expect((error as ApiRefreshValidationError).upstreamStatus).toBe(
      upstreamStatus,
    );
  });
});
