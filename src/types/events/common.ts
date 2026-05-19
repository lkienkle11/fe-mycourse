/** Nguồn phát sự kiện realtime. */
export type StreamEventSource = "broadcast" | "sse" | "websocket" | "gRPC";

/**
 * Metadata đi kèm mỗi event nhận được (server hoặc tab khác có thể gửi sẵn;
 * client sẽ bổ sung field thiếu).
 */
export type StreamInboundMetadata = {
  /** Thời điểm tạo event (ms, Unix epoch). */
  timestamp: number;
  /** Số thứ tự (tăng dần theo nguồn gửi hoặc theo client nếu thiếu). */
  seq: number;
  /** Mã ghép `source:type` — dùng để filter / log / analytics. */
  code: string;
};

/** Metadata khi gửi đi — không có `code` (client/server tự gắn khi ingest). */
export type StreamOutboundMetadata = {
  timestamp: number;
  seq: number;
};

/** Map `type` → payload cho một kênh (broadcast, sse, …). */
export type StreamEventTypeMap = Record<string, unknown>;

/**
 * Event nhận vào app: luôn có `source`, `type`, `payload`, `metadata`.
 * Khai báo `EventMap` rồi dùng generic thay vì lặp 4 field từng variant.
 */
export type StreamInboundEventOf<
  S extends StreamEventSource,
  M extends StreamEventTypeMap,
> = {
  [K in keyof M & string]: {
    source: S;
    type: K;
    payload: M[K];
    metadata: StreamInboundMetadata;
  };
}[keyof M & string];

/** Gói gửi đi — cùng shape với inbound nhưng metadata không có `code`. */
export type StreamOutboundEventOf<
  S extends StreamEventSource,
  M extends StreamEventTypeMap,
> = {
  [K in keyof M & string]: {
    source: S;
    type: K;
    payload: M[K];
    metadata: StreamOutboundMetadata;
  };
}[keyof M & string];
