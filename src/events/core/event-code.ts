import type { StreamEventSource } from "@/types/events";

/** Chuỗi mã thống nhất: `broadcast:logout`, `sse:hello`, ... */
export function makeStreamEventCode(
  source: StreamEventSource,
  type: string,
): string {
  return `${source}:${type}`;
}
