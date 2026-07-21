/**
 * Public authenticated API helpers built on ApiTransport.
 * Isomorphic factory — browser singleton lives in browser-api-methods.ts.
 */

import type { ApiResult } from "@/types/api";
import type {
  ApiTransport,
  FetchApiOptions,
  MutationApiOptions,
} from "../transport/api-transport";

export type {
  BaseApiOptions,
  FetchApiOptions,
  MutationApiOptions,
} from "../transport/api-transport";

export type ApiFetchFn = <T>(
  url: string,
  options?: FetchApiOptions,
) => Promise<ApiResult<T>>;
export type ApiPostFn = <T, D = unknown>(
  url: string,
  data?: D,
  options?: MutationApiOptions,
) => Promise<ApiResult<T>>;
export type ApiPutFn = ApiPostFn;
export type ApiPatchFn = ApiPostFn;
export type ApiDeleteFn = <T>(
  url: string,
  options?: MutationApiOptions,
) => Promise<ApiResult<T>>;
export type ApiOptionsFn = ApiDeleteFn;

export type ApiMethods = {
  apiFetch: ApiFetchFn;
  apiPost: ApiPostFn;
  apiPut: ApiPutFn;
  apiPatch: ApiPatchFn;
  apiDelete: ApiDeleteFn;
  apiOptions: ApiOptionsFn;
};

export function createApiMethods(transport: ApiTransport): ApiMethods {
  return {
    apiFetch: <T>(url: string, options: FetchApiOptions = {}) =>
      transport.request<T>({ method: "GET", url, options }),
    apiPost: <T, D = unknown>(
      url: string,
      data?: D,
      options: MutationApiOptions = {},
    ) => transport.request<T>({ method: "POST", url, data, options }),
    apiPut: <T, D = unknown>(
      url: string,
      data?: D,
      options: MutationApiOptions = {},
    ) => transport.request<T>({ method: "PUT", url, data, options }),
    apiPatch: <T, D = unknown>(
      url: string,
      data?: D,
      options: MutationApiOptions = {},
    ) => transport.request<T>({ method: "PATCH", url, data, options }),
    apiDelete: <T>(url: string, options: MutationApiOptions = {}) =>
      transport.request<T>({ method: "DELETE", url, options }),
    apiOptions: <T>(url: string, options: MutationApiOptions = {}) =>
      transport.request<T>({ method: "OPTIONS", url, options }),
  };
}
