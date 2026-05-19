import { emitStreamEventToSubscribers } from "@/events/core/subscribe";
import { useStreamEventsStore } from "@/store/events/stream-events-store";
import type { StreamEvent, StreamEventSource } from "@/types/events";

import { normalizeInboundEnvelope } from "./normalize-inbound";

/**
 * Parse JSON/string → `StreamEvent`, đẩy vào store + broadcast tới subscriber hooks.
 */
export function publishRawStreamPayload(
  raw: unknown,
  defaultSource?: StreamEventSource,
): StreamEvent | null {
  const nextSeq = () => useStreamEventsStore.getState().nextClientSeq();
  const event = normalizeInboundEnvelope(raw, { defaultSource, nextSeq });
  if (!event) {
    return null;
  }
  useStreamEventsStore.getState().push(event);
  emitStreamEventToSubscribers(event);
  return event;
}
