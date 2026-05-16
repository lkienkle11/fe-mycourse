import type { StreamEvent, StreamEventSource } from "@/types/events";

export type StreamEventFilter = {
  source?: StreamEventSource;
  type?: string;
};

type StreamEventListenerEntry = {
  order: number;
  filter?: StreamEventFilter;
  handler: (event: StreamEvent) => void;
};

const listeners: StreamEventListenerEntry[] = [];

function matchesFilter(event: StreamEvent, filter?: StreamEventFilter): boolean {
  if (filter?.source && event.source !== filter.source) {
    return false;
  }
  if (filter?.type && event.type !== filter.type) {
    return false;
  }
  return true;
}

export type SubscribeStreamEventsOptions = {
  /** Lọc theo kênh / type. Bỏ trống = nhận mọi event. */
  filter?: StreamEventFilter;
  /** Số nhỏ chạy trước. Mặc định `0`. Cùng `order` → FIFO theo lúc đăng ký. */
  order?: number;
  handler: (event: StreamEvent) => void;
};

/**
 * Đăng ký handler nhận event đã chuẩn hoá (sau khi vào store).
 * Nhiều handler cùng `(source, type)` — dùng `order` để sắp thứ tự gọi.
 */
export function subscribeStreamEvents(
  listenerOrOptions:
    | ((event: StreamEvent) => void)
    | SubscribeStreamEventsOptions,
): () => void {
  const entry: StreamEventListenerEntry =
    typeof listenerOrOptions === "function"
      ? { order: 0, filter: undefined, handler: listenerOrOptions }
      : {
          order: listenerOrOptions.order ?? 0,
          filter: listenerOrOptions.filter,
          handler: listenerOrOptions.handler,
        };

  listeners.push(entry);

  return () => {
    const index = listeners.indexOf(entry);
    if (index >= 0) {
      listeners.splice(index, 1);
    }
  };
}

export function emitStreamEventToSubscribers(event: StreamEvent): void {
  const ordered = [...listeners].sort((a, b) => a.order - b.order);
  for (const entry of ordered) {
    if (!matchesFilter(event, entry.filter)) {
      continue;
    }
    entry.handler(event);
  }
}
