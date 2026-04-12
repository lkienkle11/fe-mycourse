/** Phân nhánh SSR vs browser — thay cho `typeof window === "undefined"` rải rác. */
export function isServer(): boolean {
  return typeof window === "undefined";
}
