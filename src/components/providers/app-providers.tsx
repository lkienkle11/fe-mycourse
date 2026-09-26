"use client";

import type { ReactNode } from "react";
import { SWRConfig } from "swr";
import { AuthConfirmTabSync } from "@/components/providers/auth-confirm-tab-sync";
import { AuthLogoutTabSync } from "@/components/providers/auth-logout-tab-sync";
import { AuthModalBackgroundBridge } from "@/components/providers/auth-modal-background-bridge";
import { DEFAULT_SWR_CONFIG } from "@/constants/swr";
import { EventsStreamProvider } from "@/events";
import { useSyncMeFromAuth } from "@/hooks/auth";
import { useSyncLanguageFromLocale } from "@/hooks/language";
import { meCacheProvider } from "@/lib/swr/me-cache-provider";

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
    <SWRConfig value={{ ...DEFAULT_SWR_CONFIG, provider: meCacheProvider }}>
      <EventsStreamProvider>
        <MeSwrSync />
        <LanguageLocaleSync />
        <AuthConfirmTabSync />
        <AuthLogoutTabSync />
        <AuthModalBackgroundBridge />
        {children}
      </EventsStreamProvider>
    </SWRConfig>
  );
}
