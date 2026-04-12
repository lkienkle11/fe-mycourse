"use client";

import type { ReactNode } from "react";
import { SWRConfig } from "swr";
import { MeAuthStoreSync } from "@/components/providers/me-auth-store-sync";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        dedupingInterval: 30 * 1000,
      }}
    >
      <MeAuthStoreSync />
      {children}
    </SWRConfig>
  );
}
