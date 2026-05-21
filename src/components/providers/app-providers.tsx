"use client";

import type { ReactNode } from "react";
import { SWRConfig } from "swr";
import { AuthConfirmTabSync } from "@/components/providers/auth-confirm-tab-sync";
import { AuthLogoutTabSync } from "@/components/providers/auth-logout-tab-sync";
import { EventsStreamProvider } from "@/events";
import { useSyncMeFromAuth } from "@/hooks/auth";
import { useSyncLanguageFromLocale } from "@/hooks/language";

type AppProvidersProps = {
  children: ReactNode;
};

function MeSwrSync() {
  useSyncMeFromAuth();
  return null;
}

function LanguageLocaleSync() {
  useSyncLanguageFromLocale();
  return null;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        dedupingInterval: 30 * 1000,
      }}
    >
      <EventsStreamProvider>
        <MeSwrSync />
        <LanguageLocaleSync />
        <AuthConfirmTabSync />
        <AuthLogoutTabSync />
        {children}
      </EventsStreamProvider>
    </SWRConfig>
  );
}
