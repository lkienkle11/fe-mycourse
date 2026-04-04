"use client";

import { createContext, type ReactNode, useCallback, useState } from "react";
import { useAuth } from "@/api/hooks/auth";
import type { AuthActions } from "@/types";
import type { MeResponse } from "@/types/auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuthContextValue = {
  /** Global auth action state (none/login/signup/logout). */
  authAction: AuthActions;
  setAuthAction: (action: AuthActions) => void;

  /**
   * Path to redirect to after a successful login / sign-up.
   * Cleared automatically when `closeAllModals` is called.
   */
  nextLink: string | null;
  setNextLink: (link: string | null) => void;

  /** Opens the Login modal, optionally storing a post-auth redirect path. */
  openLoginModal: (nextPath?: string) => void;

  /** Opens the Sign-up modal, optionally storing a post-auth redirect path. */
  openSignupModal: (nextPath?: string) => void;

  /** Closes both modals and clears the stored `nextLink`. */
  closeAllModals: () => void;
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [authAction, setAuthAction] = useState<AuthActions>("none");
  const [nextLink, setNextLink] = useState<string | null>(null);

  const openLoginModal = useCallback((nextPath?: string) => {
    if (nextPath) setNextLink(nextPath);
    setAuthAction("login");
  }, []);

  const openSignupModal = useCallback((nextPath?: string) => {
    if (nextPath) setNextLink(nextPath);
    setAuthAction("signup");
  }, []);

  const closeAllModals = useCallback(() => {
    setAuthAction("none");
    setNextLink(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        authAction,
        setAuthAction,
        nextLink,
        setNextLink,
        openLoginModal,
        openSignupModal,
        closeAllModals,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Me Context
// ---------------------------------------------------------------------------

export type MeContextValue = {
  me: MeResponse | null;
  isLoading: boolean;
  isError: unknown;
  mutateMe: () => void;
};

export const MeContext = createContext<MeContextValue | null>(null);

export function MeProvider({ children }: { children: ReactNode }) {
  const { me, isLoading, error, mutate } = useAuth();

  return (
    <MeContext.Provider
      value={{ me, isLoading, isError: error, mutateMe: mutate }}
    >
      {children}
    </MeContext.Provider>
  );
}
