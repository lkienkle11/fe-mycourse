import { useStreamEventsStore } from "@/store/events/stream-events-store";
import type { WebSocketStreamEvent } from "@/types/events";

export function useLastWebSocketStreamEvent(): WebSocketStreamEvent | null {
  return useStreamEventsStore((s) =>
    s.last?.source === "websocket" ? s.last : null,
  );
}
