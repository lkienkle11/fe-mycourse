/**
 * Refresh eligibility and shared refresh orchestration helpers.
 * Isomorphic / client-safe.
 */

import {
  ApiRefreshValidationError,
  type ApiRefreshValidationReason,
} from "../core/fetch-error";
import { getHeader } from "../core/fetch-helpers";
import type { RotatedAuthSessionTokens } from "./auth-runtime";

export function requestSentNonEmptyBearer(
  headers: Record<string, string> | undefined,
): boolean {
  if (!headers) return false;
  const raw = getHeader(headers, "authorization");
  if (!raw?.trim()) return false;
  const match = /^Bearer\s+(\S+)/i.exec(raw.trim());
  return Boolean(match?.[1]);
}

/**
 * Exact refresh eligibility truth table from the SoT.
 */
export function isRefreshEligible(input: {
  status: number;
  headers: Record<string, string>;
  outgoingHadBearer: boolean;
  retried: boolean;
}): boolean {
  if (input.retried) return false;
  const { status } = input;
  if (status !== 401 && status !== 403) return false;

  const tokenExpired = getHeader(input.headers, "x-token-expired") === "true";

  if (tokenExpired) return true;
  if (status === 401 && !input.outgoingHadBearer) return true;
  return false;
}

export function validateRotatedTokens(
  payload: unknown,
): RotatedAuthSessionTokens {
  if (!payload || typeof payload !== "object") {
    throw new ApiRefreshValidationError({
      reason: "invalid-envelope",
      message: "Refresh payload is not an object",
    });
  }
  const data = payload as Record<string, unknown>;
  const access = data.access_token;
  const refresh = data.refresh_token;
  const session = data.session_id;

  const missing = (reason: ApiRefreshValidationReason, field: string) => {
    throw new ApiRefreshValidationError({
      reason,
      message: `Missing ${field}`,
    });
  };

  if (typeof access !== "string" || !access.trim()) {
    missing("missing-access-token", "access_token");
  }
  if (typeof refresh !== "string" || !refresh.trim()) {
    missing("missing-refresh-token", "refresh_token");
  }
  if (typeof session !== "string" || !session.trim()) {
    missing("missing-session-id", "session_id");
  }

  return {
    access_token: (access as string).trim(),
    refresh_token: (refresh as string).trim(),
    session_id: (session as string).trim(),
  };
}

function isFiniteInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    Number.isFinite(value)
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Exact top-level success envelope: only `{ code, message, data }`.
 * Invalid shapes throw — callers must not invent success defaults.
 */
export function parseExactRefreshSuccessEnvelope(data: unknown): {
  code: number;
  message: string;
  data: unknown;
} {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new ApiRefreshValidationError({
      reason: "invalid-envelope",
      message: "Refresh success envelope is not an object",
    });
  }
  const envelope = data as Record<string, unknown>;
  const keys = Object.keys(envelope);
  if (
    keys.length !== 3 ||
    !keys.includes("code") ||
    !keys.includes("message") ||
    !keys.includes("data")
  ) {
    throw new ApiRefreshValidationError({
      reason: "invalid-envelope",
      message:
        "Refresh success envelope keys must be exactly code/message/data",
    });
  }
  if (!isFiniteInteger(envelope.code)) {
    throw new ApiRefreshValidationError({
      reason: "invalid-envelope",
      message: "Refresh success code must be a finite integer",
    });
  }
  if (!isNonEmptyString(envelope.message)) {
    throw new ApiRefreshValidationError({
      reason: "invalid-envelope",
      message: "Refresh success message must be a non-empty string",
    });
  }
  return {
    code: envelope.code,
    message: envelope.message.trim(),
    data: envelope.data,
  };
}

/** Browser proxy success: exact envelope + data.access_token only. */
export function parseExactBrowserRefreshProxySuccess(data: unknown): {
  code: number;
  message: string;
  accessToken: string;
} {
  const envelope = parseExactRefreshSuccessEnvelope(data);
  if (
    !envelope.data ||
    typeof envelope.data !== "object" ||
    Array.isArray(envelope.data)
  ) {
    throw new ApiRefreshValidationError({
      reason: "invalid-envelope",
      message: "Browser refresh proxy data must be an object",
    });
  }
  const payload = envelope.data as Record<string, unknown>;
  const dataKeys = Object.keys(payload);
  if (dataKeys.length !== 1 || dataKeys[0] !== "access_token") {
    throw new ApiRefreshValidationError({
      reason: "invalid-envelope",
      message: "Browser refresh proxy data must be access_token-only",
    });
  }
  if (!isNonEmptyString(payload.access_token)) {
    throw new ApiRefreshValidationError({
      reason: "missing-access-token",
      message: "Browser refresh proxy missing access_token",
    });
  }
  return {
    code: envelope.code,
    message: envelope.message,
    accessToken: payload.access_token.trim(),
  };
}
