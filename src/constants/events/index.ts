/** Số event tối đa giữ trong log của store (tránh tràn bộ nhớ). */
export const STREAM_EVENTS_LOG_MAX = 100;

/** Prefix env cho URL stream (dùng trong config/events). */
export const STREAM_ENV_KEYS = {
  sse: "NEXT_PUBLIC_STREAM_SSE_URL",
  websocket: "NEXT_PUBLIC_STREAM_WS_URL",
  /** Base URL (không có slash cuối) cho luồng NDJSON gRPC / gateway. */
  grpcBase: "NEXT_PUBLIC_STREAM_GRPC_BASE_URL",
} as const;
