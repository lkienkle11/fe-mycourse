import { useStreamEventsStore } from "@/store/events/stream-events-store";
import type { BroadcastStreamEvent } from "@/types/events";

/** Event broadcast mới nhất (nếu có). */
export function useLastBroadcastStreamEvent(): BroadcastStreamEvent | null {
  return useStreamEventsStore((s) =>
    s.last?.source === "broadcast" ? s.last : null,
  );
}
