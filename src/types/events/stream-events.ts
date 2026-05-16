import type { BroadcastOutboundEvent, BroadcastStreamEvent } from "./broadcast";
import type { GrpcOutboundEvent, GrpcStreamEvent } from "./gRPC";
import type { WebSocketOutboundEvent, WebSocketStreamEvent } from "./socket";
import type { SseOutboundEvent, SseStreamEvent } from "./sse";

/** Mọi event đã chuẩn hoá khi vào app. */
export type StreamEvent =
  | BroadcastStreamEvent
  | SseStreamEvent
  | WebSocketStreamEvent
  | GrpcStreamEvent;

/** Gói gửi đi (mọi kênh). Metadata không chứa `code`. */
export type StreamOutboundEvent =
  | BroadcastOutboundEvent
  | SseOutboundEvent
  | WebSocketOutboundEvent
  | GrpcOutboundEvent;
