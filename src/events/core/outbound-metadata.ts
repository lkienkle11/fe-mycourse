import { useStreamEventsStore } from "@/store/events/stream-events-store";
import type { StreamOutboundMetadata } from "@/types/events";

/** Sinh `timestamp` + `seq` cho gói gửi đi (metadata không có `code`). */
export function nextStreamOutboundMetadata(): StreamOutboundMetadata {
  return {
    timestamp: Date.now(),
    seq: useStreamEventsStore.getState().nextClientSeq(),
  };
}
