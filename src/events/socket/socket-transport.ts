import ReconnectingWebSocket from "reconnecting-websocket";

import type { SocketEventsConfig } from "@/config/events/socket";
import { nextStreamOutboundMetadata } from "@/events/core/outbound-metadata";
import { publishRawStreamPayload } from "@/events/core/publish";
import type { WebSocketOutboundEvent } from "@/types/events";

let liveSocket: ReconnectingWebSocket | null = null;

/** WebSocket JSON text — mỗi message là một envelope đầy đủ. */
export function startSocketTransport(config: SocketEventsConfig): () => void {
  if (typeof window === "undefined" || !config.url) {
    return () => {};
  }

  const ws = new ReconnectingWebSocket(config.url);
  liveSocket = ws;

  const onMessage = (event: MessageEvent) => {
    const data = event.data;
    if (typeof data !== "string") {
      return;
    }
    try {
      const raw = JSON.parse(data) as unknown;
      const event = publishRawStreamPayload(raw, "websocket");
      if (event?.source === "websocket" && event.type === "ping") {
        postSocketOutbound({
          source: "websocket",
          type: "pong",
          payload: { id: event.payload.id },
          metadata: nextStreamOutboundMetadata(),
        });
      }
    } catch {
      // ignore non-json
    }
  };

  ws.addEventListener("message", onMessage);

  return () => {
    ws.removeEventListener("message", onMessage);
    liveSocket = null;
    ws.close();
  };
}

/** Gửi JSON text nếu socket đã kết nối (sau khi `startSocketTransport` chạy). */
export function postSocketOutbound(message: WebSocketOutboundEvent): void {
  liveSocket?.send(JSON.stringify(message));
}
