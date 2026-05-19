import { fetchEventSource } from "@microsoft/fetch-event-source";

import type { SseEventsConfig } from "@/config/events/sse";
import { publishRawStreamPayload } from "@/events/core/publish";

/**
 * SSE qua `@microsoft/fetch-event-source` (hỗ trợ header, abort, reconnect).
 * Server nên gửi từng message `data: {json}\n\n` khớp envelope stream.
 */
export function startSseTransport(config: SseEventsConfig): () => void {
  if (typeof window === "undefined" || !config.url) {
    return () => {};
  }

  const ac = new AbortController();

  void fetchEventSource(config.url, {
    signal: ac.signal,
    onmessage(ev) {
      if (!ev.data) {
        return;
      }
      try {
        const raw = JSON.parse(ev.data) as unknown;
        publishRawStreamPayload(raw, "sse");
      } catch {
        // SSE comment / heartbeat không phải JSON envelope — bỏ qua
      }
    },
    onerror() {
      /** Trả số ms trước khi reconnect (thư viện yêu cầu). */
      return 4000;
    },
  });

  return () => {
    ac.abort();
  };
}
