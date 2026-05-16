import { STREAM_ENV_KEYS } from "@/constants/events";

const url = (process.env[STREAM_ENV_KEYS.sse] ?? "").trim();

/** Cấu hình SSE — nếu `url` rỗng thì không chạy kết nối nền. */
export const sseEventsConfig = {
  url,
} as const;

export const isSseConfigured = (): boolean => Boolean(sseEventsConfig.url);

export type SseEventsConfig = typeof sseEventsConfig;
