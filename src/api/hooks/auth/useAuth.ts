"use client";

import useSWR from "swr";
import { getMeEndpointKey, getMeService } from "@/api/callers/auth";
import { extractApiError } from "@/lib/utils/api-error";
import type { MeResponse } from "@/types/auth";

export interface UseAuthReturn {
  /** Thông tin user hiện tại. `null` khi chưa đăng nhập hoặc đang load. */
  me: MeResponse | null;
  /** `true` khi đang gọi API lần đầu (chưa có dữ liệu lần nào). */
  isLoading: boolean;
  /** Lỗi nếu xảy ra (không tính 401 — 401 là chưa đăng nhập, không phải lỗi). */
  error: unknown;
  /** Numeric API error code when `error` is set; `null` otherwise. */
  errorCode: number | null;
  /** Gọi để revalidate lại dữ liệu me (dùng sau khi login/logout xong). */
  mutate: () => void;
}

/**
 * Hook lấy thông tin user đang đăng nhập thông qua GET /api/v1/me.
 *
 * - SWR tự cache, revalidate on focus, và gọi lại khi token được refresh.
 * - 401 từ BE được xử lý trong getMeService → trả về null, không throw error.
 * - Dùng `mutate()` sau khi đăng nhập / đăng xuất để cập nhật ngay lập tức.
 * - Always revalidates on mount (SWR default) even when `meCacheProvider`'s
 *   persisted `/me` entry lets this paint instantly from cache — a revoked
 *   or expired session must be detected on the very next check, not trusted
 *   for a grace window. (An earlier `revalidateOnMount: !isMeCacheFresh(...)`
 *   skip caused exactly that: `e2e/tests/auth.spec.ts`'s "an expired/revoked
 *   session logs the user out on the next check" failed because a reload
 *   soon after login kept trusting the stale cached session instead of
 *   re-checking it — removed for that reason.)
 */
export function useAuth(): UseAuthReturn {
  const { data, isLoading, error, mutate } = useSWR<MeResponse | null>(
    getMeEndpointKey,
    getMeService,
    {
      revalidateOnFocus: true,
      shouldRetryOnError: false,
    },
  );

  const errorCode = error ? extractApiError(error).code : null;

  return {
    me: data ?? null,
    isLoading,
    error,
    errorCode,
    mutate,
  };
}
