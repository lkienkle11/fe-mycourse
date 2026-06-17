import type { StreamInboundEventOf } from "../common";
import type { SseInboundEventMap } from "../payloads";

export type SseStreamEvent = StreamInboundEventOf<"sse", SseInboundEventMap>;
/** SSE không gửi ping/pong lên server — chỉ notification / hello nếu có API khác. */
// export type SseOutboundEvent = StreamOutboundEventOf<
//   "sse",
//   StreamChannelEventMap
// >;
