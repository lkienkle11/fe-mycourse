"use client";

import type { WebSocketStreamEvent } from "@/types/events";

import type { StreamEventSubscribeInput } from "../use-stream-event";
import { useStreamEvent } from "../use-stream-event";

type WsType = WebSocketStreamEvent["type"];

function toWsInput(
  input: StreamEventSubscribeInput<WebSocketStreamEvent>,
): StreamEventSubscribeInput<WebSocketStreamEvent> {
  if (typeof input === "function") {
    return (e) => {
      if (e.source === "websocket") {
        input(e);
      }
    };
  }
  if (Array.isArray(input)) {
    return input.map(({ order, handler }) => ({
      order,
      handler: (e) => {
        if (e.source === "websocket") {
          handler(e);
        }
      },
    }));
  }
  return {
    order: input.order,
    handler: (e) => {
      if (e.source === "websocket") {
        input.handler(e);
      }
    },
  };
}

export function useWebSocketStreamEvent(
  type: WsType | undefined,
  input: StreamEventSubscribeInput<WebSocketStreamEvent>,
): void {
  useStreamEvent(
    type ? { source: "websocket", type } : { source: "websocket" },
    toWsInput(input),
  );
}
