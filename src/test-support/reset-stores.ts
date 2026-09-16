import { useAuthStore, useMeStore } from "@/store/auth";

const initialAuthState = useAuthStore.getState();
const initialMeState = useMeStore.getState();

/** Resets Zustand auth/me store state between tests (called from `jest.setup.ts`). */
export function resetStores() {
  useAuthStore.setState(initialAuthState, true);
  useMeStore.setState(initialMeState, true);
}
