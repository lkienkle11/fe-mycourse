"use client";

import type { WebSocketStreamEvent } from "@/types/events";
import { createScopedStreamEventHook } from "../internal/create-scoped-stream-event-hook";

type WsType = WebSocketStreamEvent["type"];
export const useWebSocketStreamEvent: (
  type: WsType | undefined,
  input: Parameters<
    ReturnType<
      typeof createScopedStreamEventHook<"websocket", WebSocketStreamEvent>
    >
  >[1],
) => void = createScopedStreamEventHook<"websocket", WebSocketStreamEvent>(
  "websocket",
);
