/** sessionStorage flag: background tab should reload when user returns after confirm elsewhere. */
export const PENDING_AUTH_TAB_RELOAD_KEY = "mycourse:pending_auth_tab_reload";

export function markPendingAuthTabReload(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(PENDING_AUTH_TAB_RELOAD_KEY, "1");
}

export function consumePendingAuthTabReload(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  if (sessionStorage.getItem(PENDING_AUTH_TAB_RELOAD_KEY) !== "1") return false;
  sessionStorage.removeItem(PENDING_AUTH_TAB_RELOAD_KEY);
  return true;
}
