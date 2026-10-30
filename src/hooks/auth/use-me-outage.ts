"use client";

import {
  classifyApiError,
  type StatusErrorVariant,
} from "@/lib/utils/api-error";
import { useGetMe } from "./use-auth-store";

export type MeOutage = {
  variant: Extract<StatusErrorVariant, "server-error" | "network">;
  retry: () => void;
};

/**
 * Set when `/me` failed for a reason that says nothing about the session
 * (backend 5xx, timeout, no connection, or a refresh that could not conclude)
 * and there is no cached user to keep showing. A real 401 (guest), 403 and 404
 * stay `null` here, so they keep their existing sign-in or denial handling.
 */
export function useMeOutage(): MeOutage | null {
  const { me, isLoading, isError: meError, mutateMe } = useGetMe();
  if (me || isLoading || !meError) return null;
  const variant = classifyApiError(meError);
  return variant === "server-error" || variant === "network"
    ? { variant, retry: mutateMe }
    : null;
}
