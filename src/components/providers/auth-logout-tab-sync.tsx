"use client";

import { useAuthLogoutTabSync } from "@/hooks/auth/use-auth-logout-tab-sync";

export function AuthLogoutTabSync() {
  useAuthLogoutTabSync();
  return null;
}
