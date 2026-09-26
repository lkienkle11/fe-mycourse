import { mutate as swrMutate } from "swr";
import { create } from "zustand";
import { getMeEndpointKey } from "@/api/callers/auth";
import type { MeResponse } from "@/types/auth";

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
