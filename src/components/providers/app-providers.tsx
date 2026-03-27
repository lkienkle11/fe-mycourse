"use client";

import type { ReactNode } from "react";
import { SWRConfig } from "swr";

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
      {children}
    </SWRConfig>
  );
}
