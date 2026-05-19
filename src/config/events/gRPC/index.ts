import { STREAM_ENV_KEYS } from "@/constants/events";

const baseUrl = (process.env[STREAM_ENV_KEYS.grpcBase] ?? "").trim();

/**
 * Luồng NDJSON (một JSON mỗi dòng) — gateway tạm thời cho tới khi gắn gRPC-Web / Connect thật.
 * GET `${baseUrl}${streamPath}`
 */
export const grpcEventsConfig = {
  baseUrl,
  streamPath: "/v1/events/stream",
} as const;

export const isGrpcConfigured = (): boolean =>
  Boolean(grpcEventsConfig.baseUrl);

export type GrpcEventsConfig = typeof grpcEventsConfig;
