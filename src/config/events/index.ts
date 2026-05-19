import { broadcastEventsConfig } from "./broadcast";
import { grpcEventsConfig } from "./gRPC";
import { socketEventsConfig } from "./socket";
import { sseEventsConfig } from "./sse";

export * from "./broadcast";
export * from "./gRPC";
export * from "./socket";
export * from "./sse";

/** Snapshot read-only cho debug / loadConfig. */
export const eventsConfigSnapshot = {
  broadcast: broadcastEventsConfig,
  sse: sseEventsConfig,
  socket: socketEventsConfig,
  grpc: grpcEventsConfig,
} as const;
