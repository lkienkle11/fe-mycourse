import { STREAM_ENV_KEYS } from "@/constants/events";

const url = (process.env[STREAM_ENV_KEYS.websocket] ?? "").trim();

/** WebSocket — chỉ kết nối khi `url` khác rỗng. */
export const socketEventsConfig = {
  url,
} as const;

export const isSocketConfigured = (): boolean =>
  Boolean(socketEventsConfig.url);

export type SocketEventsConfig = typeof socketEventsConfig;
