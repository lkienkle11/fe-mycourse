/**
 * Browser-bound ApiTransport + ApiMethods.
 * Imports Zustand reporter — do not import this module from server-only code.
 */

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

export const apiTransport: ApiTransport =
  createBrowserApiTransport(browserPushApiError);

export const browserApiMethods: ApiMethods = createApiMethods(apiTransport);

export const { apiFetch, apiPost, apiPut, apiPatch, apiDelete, apiOptions } =
  browserApiMethods;
