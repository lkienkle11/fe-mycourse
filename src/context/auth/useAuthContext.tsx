"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { AuthActions } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AuthContextValue = {
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

const AuthContext = createContext<AuthContextValue | null>(null);

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
// Hook
// ---------------------------------------------------------------------------

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an <AuthProvider>.");
  }
  return context;
}
