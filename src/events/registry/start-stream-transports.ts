import { broadcastEventsConfig } from "@/config/events/broadcast";
import { grpcEventsConfig, isGrpcConfigured } from "@/config/events/gRPC";
import { isSocketConfigured, socketEventsConfig } from "@/config/events/socket";
import { isSseConfigured, sseEventsConfig } from "@/config/events/sse";
import { startBroadcastTransport } from "@/events/broadcast/broadcast-transport";
import { startGrpcNdjsonTransport } from "@/events/gRPC/grpc-transport";
import { startSocketTransport } from "@/events/socket/socket-transport";
import { startSseTransport } from "@/events/sse/sse-transport";

/**
 * Khởi động các transport:
 * - Broadcast luôn (nếu `enabled` trong config).
 * - SSE / WebSocket / gRPC chỉ khi đã cấu hình endpoint trong env.
 */
export function startStreamEventTransports(): () => void {
  const stopFns: Array<() => void> = [];

  if (broadcastEventsConfig.enabled) {
    stopFns.push(startBroadcastTransport());
  }

  if (isSseConfigured()) {
    stopFns.push(startSseTransport(sseEventsConfig));
  }

  if (isSocketConfigured()) {
    stopFns.push(startSocketTransport(socketEventsConfig));
  }

  if (isGrpcConfigured()) {
    stopFns.push(startGrpcNdjsonTransport(grpcEventsConfig));
  }

  return () => {
    for (const stop of stopFns) {
      stop();
    }
  };
}
