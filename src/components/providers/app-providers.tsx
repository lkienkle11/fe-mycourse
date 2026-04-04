"use client";

import type { ReactNode } from "react";
import { SWRConfig } from "swr";
import { AuthProvider, MeProvider } from "@/context";

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
      <AuthProvider>
        <MeProvider>{children}</MeProvider>
      </AuthProvider>
    </SWRConfig>
  );
}
