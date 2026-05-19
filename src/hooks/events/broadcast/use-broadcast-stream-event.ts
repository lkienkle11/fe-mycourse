"use client";

import type { BroadcastStreamEvent } from "@/types/events";

import type { StreamEventSubscribeInput } from "../use-stream-event";
import { useStreamEvent } from "../use-stream-event";

type BroadcastType = BroadcastStreamEvent["type"];

function toBroadcastInput(
  input: StreamEventSubscribeInput<BroadcastStreamEvent>,
): StreamEventSubscribeInput<BroadcastStreamEvent> {
  if (typeof input === "function") {
    return (e) => {
      if (e.source === "broadcast") {
        input(e);
      }
    };
  }
  if (Array.isArray(input)) {
    return input.map(({ order, handler }) => ({
      order,
      handler: (e) => {
        if (e.source === "broadcast") {
          handler(e);
        }
      },
    }));
  }
  return {
    order: input.order,
    handler: (e) => {
      if (e.source === "broadcast") {
        input.handler(e);
      }
    },
  };
}

/**
 * Chỉ nhận event `source === 'broadcast'`, có thể lọc theo `type`.
 */
export function useBroadcastStreamEvent(
  type: BroadcastType | undefined,
  input: StreamEventSubscribeInput<BroadcastStreamEvent>,
): void {
  useStreamEvent(
    type ? { source: "broadcast", type } : { source: "broadcast" },
    toBroadcastInput(input),
  );
}
