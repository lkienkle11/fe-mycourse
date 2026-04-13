"use client";

import type { ReactNode } from "react";
import { SWRConfig } from "swr";
import { useSyncMeFromAuth } from "@/helpers/store";

type AppProvidersProps = {
  children: ReactNode;
};

function MeSwrSync() {
  useSyncMeFromAuth();
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
      <MeSwrSync />
      {children}
    </SWRConfig>
  );
}
