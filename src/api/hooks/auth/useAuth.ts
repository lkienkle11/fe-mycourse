"use client";

import useSWR from "swr";
import { getMeEndpointKey, getMeService } from "@/api/callers/auth";
import { SWR_DEDUPING_INTERVAL_MS } from "@/constants/swr";
import { usePathname } from "@/i18n/navigation";
import { isAuthRoutePath } from "@/lib/security/web/safe-redirect";
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
 * - Revalidates on mount (SWR default) on every route EXCEPT `/login`/
 *   `/signup`, where it skips the fetch if `meCacheProvider`'s persisted
 *   `/me` entry is less than `SWR_DEDUPING_INTERVAL_MS` old — avoids a
 *   redundant network call on a fast bounce between those two full pages
 *   (each a hard nav; see `me-cache-provider.ts`). Scoped to those two
 *   routes only: skipping it anywhere else (e.g. a reload of `/instructor`)
 *   would let a revoked/expired session survive undetected for that whole
 *   window — an earlier, unscoped version of this skip did exactly that and
 *   failed `e2e/tests/auth.spec.ts`'s "an expired/revoked session logs the
 *   user out on the next check".
 */
export function useAuth(): UseAuthReturn {
  const pathname = usePathname();
  const skipRevalidateOnMount =
    isAuthRoutePath(pathname) && isMeCacheFresh(SWR_DEDUPING_INTERVAL_MS);
  const { data, isLoading, error, mutate } = useSWR<MeResponse | null>(
    getMeEndpointKey,
    getMeService,
    {
      revalidateOnFocus: true,
      revalidateOnMount: !skipRevalidateOnMount,
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
