import type {
  StreamInboundEventOf,
  StreamOutboundEventOf,
} from "../common";
import type { StreamWebSocketEventMap } from "../payloads";

export type WebSocketStreamEvent = StreamInboundEventOf<
  "websocket",
  StreamWebSocketEventMap
>;
export type WebSocketOutboundEvent = StreamOutboundEventOf<
  "websocket",
  StreamWebSocketEventMap
>;
