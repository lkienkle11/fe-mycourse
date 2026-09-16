import { jest } from "@jest/globals";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { type ReactNode, useMemo } from "react";

/** Stub `AppRouterInstance` for components calling `useRouter()` under jsdom. */
export function buildMockAppRouter(
  overrides: Partial<AppRouterInstance> = {},
): AppRouterInstance {
  return {
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    ...overrides,
  };
}

type MockAppRouterProviderProps = {
  children: ReactNode;
  router?: Partial<AppRouterInstance>;
};

/** Provides `AppRouterContext` so components calling `useRouter()` render under jsdom. */
export function MockAppRouterProvider({
  children,
  router,
}: MockAppRouterProviderProps) {
  const value = useMemo(() => buildMockAppRouter(router), [router]);
  return (
    <AppRouterContext.Provider value={value}>
      {children}
    </AppRouterContext.Provider>
  );
}
