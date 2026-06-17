import type { BroadcastStreamEvent } from "./broadcast";
import type { GrpcStreamEvent } from "./gRPC";
import type { WebSocketStreamEvent } from "./socket";
import type { SseStreamEvent } from "./sse";

/** Mọi event đã chuẩn hoá khi vào app. */
export type StreamEvent =
  | BroadcastStreamEvent
  | SseStreamEvent
  | WebSocketStreamEvent
  | GrpcStreamEvent;

// /** Gói gửi đi (mọi kênh). Metadata không chứa `code`. */
// export type StreamOutboundEvent =
//   | BroadcastOutboundEvent
//   | SseOutboundEvent
//   | WebSocketOutboundEvent
//   | GrpcOutboundEvent;
