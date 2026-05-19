import type { StreamInboundEventOf, StreamOutboundEventOf } from "../common";
import type { StreamChannelEventMap } from "../payloads";

/** Cùng shape demo với SSE/WS; sau này thay payload theo proto thật. */
export type GrpcStreamEvent = StreamInboundEventOf<
  "gRPC",
  StreamChannelEventMap
>;
export type GrpcOutboundEvent = StreamOutboundEventOf<
  "gRPC",
  StreamChannelEventMap
>;
