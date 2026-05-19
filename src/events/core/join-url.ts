/** Nối base URL và path, tránh `//` thừa. */
export function joinBaseUrlAndPath(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
