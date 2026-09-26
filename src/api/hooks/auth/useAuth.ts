"use client";

import useSWR from "swr";
import { getMeEndpointKey, getMeService } from "@/api/callers/auth";
import { SWR_DEDUPING_INTERVAL_MS } from "@/constants/swr";
import { isMeCacheFresh } from "@/lib/swr/me-cache-provider";
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
 * - Skips the on-mount revalidation entirely when the persisted `/me` cache
 *   (`meCacheProvider`) was written less than `SWR_DEDUPING_INTERVAL_MS` ago —
 *   this is the case right after a hard reload (e.g. bouncing between the
 *   `/login`/`/signup` full pages, which forces a hard nav), where a fresh
 *   network round-trip this soon can't plausibly reflect a real session
 *   change. `revalidateOnFocus`/`mutate()` still refresh it normally after
 *   that window, or immediately after an explicit login/logout.
 */
export function useAuth(): UseAuthReturn {
  const { data, isLoading, error, mutate } = useSWR<MeResponse | null>(
    getMeEndpointKey,
    getMeService,
    {
      revalidateOnFocus: true,
      revalidateOnMount: !isMeCacheFresh(SWR_DEDUPING_INTERVAL_MS),
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
