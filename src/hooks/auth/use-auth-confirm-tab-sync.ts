"use client";

import { useEffect } from "react";
import {
  consumePendingAuthTabReload,
  markPendingAuthTabReload,
} from "@/lib/auth/pending-tab-auth-sync";
import { useBroadcastStreamEvent } from "@/hooks/events/broadcast/use-broadcast-stream-event";

/**
 * Background tabs: on confirm_success, set a sessionStorage flag.
 * When the user focuses that tab, reload to pick up auth cookies and /me.
 * The visible confirm tab does not set the flag.
 */
export function useAuthConfirmTabSync(): void {
  useBroadcastStreamEvent("confirm_success", {
    handler: () => {
      if (document.visibilityState === "hidden") {
        markPendingAuthTabReload();
      }
    },
  });

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      if (!consumePendingAuthTabReload()) return;
      window.location.reload();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);
}
