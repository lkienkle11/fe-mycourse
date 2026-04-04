"use client";

import useSWR from "swr";
import { getMeEndpointKey, getMeService } from "@/api/callers/auth";
import type { MeResponse } from "@/types/auth";

export interface UseAuthReturn {
  /** Thông tin user hiện tại. `null` khi chưa đăng nhập hoặc đang load. */
  me: MeResponse | null;
  /** `true` khi đang gọi API lần đầu (chưa có dữ liệu lần nào). */
  isLoading: boolean;
  /** Lỗi nếu xảy ra (không tính 401 — 401 là chưa đăng nhập, không phải lỗi). */
  error: unknown;
  /** Gọi để revalidate lại dữ liệu me (dùng sau khi login/logout xong). */
  mutate: () => void;
}

/**
 * Hook lấy thông tin user đang đăng nhập thông qua GET /api/v1/me.
 *
 * - SWR tự cache, revalidate on focus, và gọi lại khi token được refresh.
 * - 401 từ BE được xử lý trong getMeService → trả về null, không throw error.
 * - Dùng `mutate()` sau khi đăng nhập / đăng xuất để cập nhật ngay lập tức.
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

  return {
    me: data ?? null,
    isLoading,
    error,
    mutate,
  };
}
