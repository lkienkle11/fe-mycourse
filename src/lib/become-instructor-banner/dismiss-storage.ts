/** localStorage flag: learner promo banner above site Header was dismissed. */
export const BECOME_INSTRUCTOR_BANNER_DISMISSED_KEY =
  "mycourse:become_instructor_banner_dismissed";

export const BECOME_INSTRUCTOR_PROMO_BANNER_HEIGHT_PX = 40;

const dismissedListeners = new Set<() => void>();

export function subscribeBecomeInstructorBannerDismissed(
  onStoreChange: () => void,
): () => void {
  dismissedListeners.add(onStoreChange);
  return () => {
    dismissedListeners.delete(onStoreChange);
  };
}

export function getBecomeInstructorBannerDismissedSnapshot(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(BECOME_INSTRUCTOR_BANNER_DISMISSED_KEY) === "1";
}

/** Hide banner during SSR; client reads localStorage on hydrate. */
export function getBecomeInstructorBannerDismissedServerSnapshot(): boolean {
  return true;
}

export function isBecomeInstructorBannerDismissed(): boolean {
  return getBecomeInstructorBannerDismissedSnapshot();
}

export function dismissBecomeInstructorBanner(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(BECOME_INSTRUCTOR_BANNER_DISMISSED_KEY, "1");
  for (const listener of dismissedListeners) {
    listener();
  }
}
