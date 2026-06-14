"use client";

import { useGetMe } from "@/hooks/auth/use-auth-store";
import { useBroadcastStreamEvent } from "@/hooks/events/broadcast/use-broadcast-stream-event";

/**
 * Other tabs: on logout broadcast, clear cookies, revalidate /me, reload.
 */
export function useAuthLogoutTabSync(): void {
  const { mutateMe } = useGetMe();

  useBroadcastStreamEvent("logout", {
    handler: () => {
      void (async () => {
        await mutateMe();
        window.location.reload();
      })();
    },
  });
}
