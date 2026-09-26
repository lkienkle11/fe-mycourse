import { resetDashboardAutoPromptTracking } from "@/components/common/dashboard/dashboard-layout";
import { useMeStore } from "@/store/auth";

const initialMeState = useMeStore.getState();

/** Resets Zustand me store state and module-level UI state between tests (called from `jest.setup.ts`). */
export function resetStores() {
  useMeStore.setState(initialMeState, true);
  resetDashboardAutoPromptTracking();
}
