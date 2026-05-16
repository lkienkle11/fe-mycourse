import { useStreamEventsStore } from "@/store/events/stream-events-store";
import type { SseStreamEvent } from "@/types/events";

export function useLastSseStreamEvent(): SseStreamEvent | null {
  return useStreamEventsStore((s) =>
    s.last?.source === "sse" ? s.last : null,
  );
}
