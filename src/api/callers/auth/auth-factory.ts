/**
 * Auth domain callers — isomorphic factory only.
 * Server Actions MUST import from this file (not auth-browser / barrel evaluation of Zustand).
 */

import { isApiHttpError } from "@/api/core/fetch-error";
import type { ApiMethods } from "@/api/core/methods";
import { API_PRIVATE_ROUTES, API_PUBLIC_ROUTES } from "@/constants/api-route";
import { buildQueryParams } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";
import type { LoginResponse, MeResponse } from "@/types/auth";

export interface LoginPayload {
  email: string;
  password: string;
  remember_me: boolean;
}

export interface RegisterPayload {
  email: string;
  password: string;
  display_name: string;
  locale: string;
}

/** @deprecated Use RegisterPayload */
export type SignupPayload = RegisterPayload;

export interface ConfirmPayload {
  token: string;
}

export interface UpdateMePayload {
  avatar_file_id?: string;
}

export interface GoogleLoginPayload {
  code: string;
  remember_me: boolean;
}

export interface GoogleOneTapPayload {
  credential: string;
}

export interface XLoginPayload {
  code: string;
  code_verifier: string;
  remember_me: boolean;
  entrypoint: "login" | "signup";
}

export interface DiscordLoginPayload {
  code: string;
  remember_me: boolean;
  entrypoint: "login" | "signup";
}

/**
 * SWR cache key cho endpoint GET /api/v1/me.
 */
export const getMeEndpointKey = buildQueryParams(
  API_PRIVATE_ROUTES.user.getMe,
  undefined,
  undefined,
  undefined,
);

export function createAuthCallers(methods: ApiMethods) {
  return {
    async getMeService(): Promise<MeResponse | null> {
      const endpointKey = getMeEndpointKey;
      if (!endpointKey) return null;
      try {
        const { data } =
          await methods.apiFetch<ApiResponse<MeResponse>>(endpointKey);
        return data.data;
      } catch (err) {
        if (isApiHttpError(err) && err.response.status === 401) return null;
        throw err;
      }
    },

    async loginService(payload: LoginPayload): Promise<{
      data: ApiResponse<LoginResponse>;
      cookies: Record<string, string>;
      setCookieHeaders: string | string[] | undefined;
    }> {
      const { data, cookies, setCookieHeaders } = await methods.apiPost<
        ApiResponse<LoginResponse>,
        LoginPayload
      >(API_PUBLIC_ROUTES.auth.login, payload);
      return { data, cookies, setCookieHeaders };
    },

    async registerService(
      payload: RegisterPayload,
    ): Promise<{ data: ApiResponse<null> }> {
      const { data } = await methods.apiPost<
        ApiResponse<null>,
        RegisterPayload
      >(API_PUBLIC_ROUTES.auth.register, payload);
      return { data };
    },

    async confirmService(payload: ConfirmPayload): Promise<{
      data: ApiResponse<LoginResponse>;
      setCookieHeaders: string | string[] | undefined;
    }> {
      const { data, setCookieHeaders } = await methods.apiPost<
        ApiResponse<LoginResponse>,
        ConfirmPayload
      >(API_PUBLIC_ROUTES.auth.confirm, payload);
      return { data, setCookieHeaders };
    },

    async googleLoginService(payload: GoogleLoginPayload): Promise<{
      data: ApiResponse<LoginResponse>;
      setCookieHeaders: string | string[] | undefined;
    }> {
      const { data, setCookieHeaders } = await methods.apiPost<
        ApiResponse<LoginResponse>,
        GoogleLoginPayload
      >(API_PUBLIC_ROUTES.auth.google, payload);
      return { data, setCookieHeaders };
    },

    async googleOneTapService(payload: GoogleOneTapPayload): Promise<{
      data: ApiResponse<LoginResponse>;
      setCookieHeaders: string | string[] | undefined;
    }> {
      const { data, setCookieHeaders } = await methods.apiPost<
        ApiResponse<LoginResponse>,
        GoogleOneTapPayload
      >(API_PUBLIC_ROUTES.auth.googleOnetap, payload);
      return { data, setCookieHeaders };
    },

    async xLoginService(payload: XLoginPayload): Promise<{
      data: ApiResponse<LoginResponse>;
      setCookieHeaders: string | string[] | undefined;
    }> {
      const { data, setCookieHeaders } = await methods.apiPost<
        ApiResponse<LoginResponse>,
        XLoginPayload
      >(API_PUBLIC_ROUTES.auth.x, payload);
      return { data, setCookieHeaders };
    },

    async discordLoginService(payload: DiscordLoginPayload): Promise<{
      data: ApiResponse<LoginResponse>;
      setCookieHeaders: string | string[] | undefined;
    }> {
      const { data, setCookieHeaders } = await methods.apiPost<
        ApiResponse<LoginResponse>,
        DiscordLoginPayload
      >(API_PUBLIC_ROUTES.auth.discord, payload);
      return { data, setCookieHeaders };
    },

    async logoutService(
      refreshToken: string,
      sessionId: string,
    ): Promise<{ data: ApiResponse<null> }> {
      const { data } = await methods.apiPost<ApiResponse<null>>(
        API_PUBLIC_ROUTES.auth.logout,
        null,
        {
          headers: {
            "X-Refresh-Token": refreshToken,
            "X-Session-Id": sessionId,
          },
        },
      );
      return { data };
    },

    async patchMeService(payload: UpdateMePayload): Promise<MeResponse> {
      const endpointKey =
        buildQueryParams(
          API_PRIVATE_ROUTES.user.patchMe,
          undefined,
          undefined,
          undefined,
        ) ?? API_PRIVATE_ROUTES.user.patchMe;
      const { data } = await methods.apiPatch<
        ApiResponse<MeResponse>,
        UpdateMePayload
      >(endpointKey, payload);
      if (!data.data) {
        throw new Error("PATCH /me returned no data");
      }
      return data.data;
    },

    async deleteMeService(): Promise<void> {
      const endpointKey =
        buildQueryParams(
          API_PRIVATE_ROUTES.user.deleteMe,
          undefined,
          undefined,
          undefined,
        ) ?? API_PRIVATE_ROUTES.user.deleteMe;
      await methods.apiDelete<ApiResponse<null>>(endpointKey);
    },

    async hardDeleteMeService(): Promise<void> {
      const endpointKey =
        buildQueryParams(
          API_PRIVATE_ROUTES.user.hardDeleteMe,
          undefined,
          undefined,
          undefined,
        ) ?? API_PRIVATE_ROUTES.user.hardDeleteMe;
      await methods.apiDelete<ApiResponse<null>>(endpointKey);
    },

    async getMyPermissionsService(): Promise<string[]> {
      const endpointKey =
        buildQueryParams(
          API_PRIVATE_ROUTES.user.getMyPermissions,
          undefined,
          undefined,
          undefined,
        ) ?? API_PRIVATE_ROUTES.user.getMyPermissions;
      const { data } =
        await methods.apiFetch<ApiResponse<string[]>>(endpointKey);
      return data.data ?? [];
    },
  };
}
