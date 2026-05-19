/** Payload dùng chung cho sse / websocket / gRPC (demo). */
export type StreamHelloPayload = {
  message: string;
  from?: string;
};

export type StreamNotificationPayload = {
  title: string;
  body?: string;
};

/** Heartbeat — `id` tuỳ chọn để ghép cặp ping ↔ pong. */
export type StreamPingPayload = {
  id?: string;
};

export type StreamPongPayload = {
  /** Echo `id` từ ping khi có. */
  id?: string;
};

/** Các `type` + payload dùng chung cho gRPC (và outbound SSE). */
export type StreamChannelEventMap = {
  notification: StreamNotificationPayload;
  hello: StreamHelloPayload;
};

/** WebSocket: client và server đều có thể gửi ping / pong. */
export type StreamWebSocketEventMap = StreamChannelEventMap & {
  ping: StreamPingPayload;
  pong: StreamPongPayload;
};

/**
 * SSE inbound: server → client.
 * Không có `ping` — client không gửi được trên kênh SSE.
 */
export type SseInboundEventMap = StreamChannelEventMap & {
  pong: StreamPongPayload;
};
