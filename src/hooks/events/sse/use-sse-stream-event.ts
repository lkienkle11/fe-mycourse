"use client";

import type { SseStreamEvent } from "@/types/events";

import type { StreamEventSubscribeInput } from "../use-stream-event";
import { useStreamEvent } from "../use-stream-event";

type SseType = SseStreamEvent["type"];

function toSseInput(
  input: StreamEventSubscribeInput<SseStreamEvent>,
): StreamEventSubscribeInput<SseStreamEvent> {
  if (typeof input === "function") {
    return (e) => {
      if (e.source === "sse") {
        input(e);
      }
    };
  }
  if (Array.isArray(input)) {
    return input.map(({ order, handler }) => ({
      order,
      handler: (e) => {
        if (e.source === "sse") {
          handler(e);
        }
      },
    }));
  }
  return {
    order: input.order,
    handler: (e) => {
      if (e.source === "sse") {
        input.handler(e);
      }
    },
  };
}

export function useSseStreamEvent(
  type: SseType | undefined,
  input: StreamEventSubscribeInput<SseStreamEvent>,
): void {
  useStreamEvent(
    type ? { source: "sse", type } : { source: "sse" },
    toSseInput(input),
  );
}
