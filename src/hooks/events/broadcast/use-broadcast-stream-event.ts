"use client";

import type { BroadcastStreamEvent } from "@/types/events";
import { createScopedStreamEventHook } from "../internal/create-scoped-stream-event-hook";

type BroadcastType = BroadcastStreamEvent["type"];

/**
 * Chỉ nhận event `source === 'broadcast'`, có thể lọc theo `type`.
 */
export const useBroadcastStreamEvent: (
  type: BroadcastType | undefined,
  input: Parameters<
    ReturnType<
      typeof createScopedStreamEventHook<"broadcast", BroadcastStreamEvent>
    >
  >[1],
) => void = createScopedStreamEventHook<"broadcast", BroadcastStreamEvent>(
  "broadcast",
);
