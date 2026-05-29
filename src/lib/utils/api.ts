import { ApiErrorCode } from "@/constants/api-error-code";
import type { ApiResponse } from "@/types/api";

/** Returns `true` when the response indicates a successful operation (code === 0). */
export function isApiSuccess<T>(
  res: ApiResponse<T>,
): res is ApiResponse<T> & { data: T } {
  return res.code === ApiErrorCode.Success;
}
