/**
 * Browser-bound ApiTransport + ApiMethods.
 * Imports Zustand reporter — do not import this module from server-only code.
 */

import { BROADCAST_LOGOUT_REASON } from "@/constants/events";
import { sendBroadcastOutbound } from "@/events/broadcast/send-broadcast-outbound";
import { useApiError } from "@/store/api-error-store";
import { type ApiMethods, createApiMethods } from "../core/methods";
import {
  type ApiErrorStorePush,
  type ApiTransport,
  createBrowserApiTransport,
} from "./api-transport";

const browserPushApiError: ApiErrorStorePush = (entry) => {
  useApiError.getState().push(entry);
};

/** The refresh proxy cleared a dead session: tell the other tabs once. */
const browserSessionCleared = () => {
  sendBroadcastOutbound({
    source: "broadcast",
    type: "logout",
    payload: { reason: BROADCAST_LOGOUT_REASON.sessionExpired },
  });
};

export const apiTransport: ApiTransport = createBrowserApiTransport(
  browserPushApiError,
  browserSessionCleared,
);

export const browserApiMethods: ApiMethods = createApiMethods(apiTransport);

export const { apiFetch, apiPost, apiPut, apiPatch, apiDelete, apiOptions } =
  browserApiMethods;
