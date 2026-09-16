import { describe, expect, it } from "@jest/globals";
import { ApiRefreshValidationError } from "../core/fetch-error";
import {
  isRefreshEligible,
  parseExactBrowserRefreshProxySuccess,
  parseExactRefreshSuccessEnvelope,
  requestSentNonEmptyBearer,
  validateRotatedTokens,
} from "./auth-refresh";

describe("requestSentNonEmptyBearer", () => {
  it.each([
    [undefined, false],
    [{}, false],
    [{ authorization: "" }, false],
    [{ authorization: "Bearer " }, false],
    [{ authorization: "Basic abc123" }, false],
    [{ authorization: "Bearer abc123" }, true],
    [{ Authorization: "bearer abc123" }, true],
  ])("returns %p for headers %p", (headers, expected) => {
    expect(requestSentNonEmptyBearer(headers as Record<string, string>)).toBe(
      expected,
    );
  });
});

describe("isRefreshEligible", () => {
  const base = {
    status: 401,
    headers: {} as Record<string, string>,
    outgoingHadBearer: false,
    retried: false,
  };

  it.each([
    [
      "already retried short-circuits to false",
      { ...base, retried: true },
      false,
    ],
    ["status 200 is never eligible", { ...base, status: 200 }, false],
    ["status 404 is never eligible", { ...base, status: 404 }, false],
    [
      "401 with expired header is eligible",
      { ...base, headers: { "x-token-expired": "true" } },
      true,
    ],
    [
      "403 with expired header is eligible",
      { ...base, status: 403, headers: { "x-token-expired": "true" } },
      true,
    ],
    [
      "401 without bearer and without expired header is eligible",
      { ...base, outgoingHadBearer: false },
      true,
    ],
    [
      "401 with bearer and without expired header is not eligible",
      { ...base, outgoingHadBearer: true },
      false,
    ],
    [
      "403 without bearer and without expired header is not eligible",
      { ...base, status: 403, outgoingHadBearer: false },
      false,
    ],
  ])("%s", (_label, input, expected) => {
    expect(isRefreshEligible(input)).toBe(expected);
  });
});

describe("validateRotatedTokens", () => {
  it("returns trimmed tokens for a valid payload", () => {
    const result = validateRotatedTokens({
      access_token: " access-1 ",
      refresh_token: " refresh-1 ",
      session_id: " session-1 ",
    });
    expect(result).toEqual({
      access_token: "access-1",
      refresh_token: "refresh-1",
      session_id: "session-1",
    });
  });

  it.each([
    ["null payload", null, "invalid-envelope"],
    ["non-object payload", "oops", "invalid-envelope"],
    [
      "missing access_token",
      { refresh_token: "r", session_id: "s" },
      "missing-access-token",
    ],
    [
      "missing refresh_token",
      { access_token: "a", session_id: "s" },
      "missing-refresh-token",
    ],
    [
      "missing session_id",
      { access_token: "a", refresh_token: "r" },
      "missing-session-id",
    ],
    [
      "blank access_token",
      { access_token: "  ", refresh_token: "r", session_id: "s" },
      "missing-access-token",
    ],
  ])("rejects %s", (_label, payload, reason) => {
    expect(() => validateRotatedTokens(payload)).toThrow(
      ApiRefreshValidationError,
    );
    try {
      validateRotatedTokens(payload);
    } catch (error) {
      expect(error).toBeInstanceOf(ApiRefreshValidationError);
      expect(
        (error as InstanceType<typeof ApiRefreshValidationError>).reason,
      ).toBe(reason);
    }
  });
});

describe("parseExactRefreshSuccessEnvelope", () => {
  it("accepts an exact code/message/data envelope", () => {
    const result = parseExactRefreshSuccessEnvelope({
      code: 200,
      message: " ok ",
      data: { access_token: "a" },
    });
    expect(result).toEqual({
      code: 200,
      message: "ok",
      data: { access_token: "a" },
    });
  });

  it.each([
    ["non-object", "oops"],
    ["array", [1, 2, 3]],
    ["extra key", { code: 200, message: "ok", data: {}, extra: 1 }],
    ["missing data key", { code: 200, message: "ok" }],
    ["non-integer code", { code: 200.5, message: "ok", data: {} }],
    ["blank message", { code: 200, message: "  ", data: {} }],
  ])("rejects %s", (_label, payload) => {
    expect(() => parseExactRefreshSuccessEnvelope(payload)).toThrow(
      ApiRefreshValidationError,
    );
  });
});

describe("parseExactBrowserRefreshProxySuccess", () => {
  it("accepts an access_token-only data payload", () => {
    const result = parseExactBrowserRefreshProxySuccess({
      code: 200,
      message: "ok",
      data: { access_token: " token-1 " },
    });
    expect(result).toEqual({
      code: 200,
      message: "ok",
      accessToken: "token-1",
    });
  });

  it.each([
    [
      "data has extra keys",
      { code: 200, message: "ok", data: { access_token: "t", extra: 1 } },
    ],
    ["data missing access_token", { code: 200, message: "ok", data: {} }],
    [
      "data access_token is blank",
      { code: 200, message: "ok", data: { access_token: "  " } },
    ],
    ["data is an array", { code: 200, message: "ok", data: [] }],
  ])("rejects %s", (_label, payload) => {
    expect(() => parseExactBrowserRefreshProxySuccess(payload)).toThrow(
      ApiRefreshValidationError,
    );
  });
});
