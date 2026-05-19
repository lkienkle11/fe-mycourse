import { useStreamEventsStore } from "@/store/events/stream-events-store";
import type { GrpcStreamEvent } from "@/types/events";

export function useLastGrpcStreamEvent(): GrpcStreamEvent | null {
  return useStreamEventsStore((s) =>
    s.last?.source === "gRPC" ? s.last : null,
  );
}
