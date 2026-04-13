import { mutate as swrMutate } from "swr";
import { create } from "zustand";
import { getMeEndpointKey } from "@/api/callers/auth";
import type { AuthActions } from "@/types";
import type { MeResponse } from "@/types/auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuthStoreState = {
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
// Me / User State
// ---------------------------------------------------------------------------

export type MeStoreState = {
  me: MeResponse | null;
  isLoading: boolean;
  isError: unknown;
  mePermissions: string[];
  mutateMe: () => void;
};

type MeAuthPayload = {
  me: MeResponse | null;
  isLoading: boolean;
  error: unknown;
  mePermissions: string[];
  mutate: () => void;
};

type MeStoreActions = {
  /** Đồng bộ từ `useAuth()` (SWR) — chỉ qua `useSyncMeFromAuth` trong `AppProviders`. */
  syncFromUseAuth: (payload: MeAuthPayload) => void;
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const defaultMutateMe = () => {
  void swrMutate(getMeEndpointKey);
};

export const useMeStore = create<MeStoreState & MeStoreActions>((set) => ({
  me: null,
  isLoading: true,
  isError: undefined,
  mePermissions: [],
  mutateMe: defaultMutateMe,

  syncFromUseAuth: ({ me, isLoading, error, mePermissions, mutate }) =>
    set({
      me,
      isLoading,
      isError: error,
      mePermissions,
      mutateMe: mutate,
    }),
}));

export const useAuthStore = create<AuthStoreState>((set) => ({
  authAction: "none",
  nextLink: null,

  setAuthAction: (action) => set({ authAction: action }),

  setNextLink: (link) => set({ nextLink: link }),

  openLoginModal: (nextPath) =>
    set((state) => ({
      authAction: "login",
      ...(nextPath ? { nextLink: nextPath } : { nextLink: state.nextLink }),
    })),

  openSignupModal: (nextPath) =>
    set((state) => ({
      authAction: "signup",
      ...(nextPath ? { nextLink: nextPath } : { nextLink: state.nextLink }),
    })),

  closeAllModals: () => set({ authAction: "none", nextLink: null }),
}));
